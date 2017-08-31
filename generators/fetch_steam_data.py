import argparse
import concurrent.futures
import json
import math
import os
import time
import MySQLdb
import requests
from cfg import Config
from itertools import zip_longest


def grouper(iterable, n, fill_value=None):
    args = [iter(iterable)] * n
    return zip_longest(*args, fillvalue=fill_value)


def debug(obj):
    print(json.dumps(obj, sort_keys=True, indent=4))


class SteamFriendData:
    API_BASE = "http://api.steampowered.com/ISteamUser/"
    FRIEND_API = "{api_base}GetFriendList/v0001/?key={api_key}&steamid={steam_id}&relationship=friend"
    USER_API = "{api_base}GetPlayerSummaries/v0002/?key={api_key}&steamids={steam_id}"
    profiles = {}
    futures = []
    depth = 1
    max_threads = os.cpu_count() * 100
    calls_made = 0
    error_profiles = set()

    def __init__(self, user, depth=1):
        self.user = user
        self.depth = depth
        self.error_profiles = set()
        self.config = Config()
        self.profiles = {str(user): {"personaname": "", "friends": []}}
        self.db = MySQLdb.connect(
            host=self.config.db_host,
            user=self.config.db_user,
            passwd=self.config.db_pw,
            db=self.config.db
        )
        self.calls_made = 0
        self.fetch_friends([str(user)])
        for _ in range(self.depth):
            self.mass_fetch_friends()
        self.fetch_profile_info()
        # self.update_401()
        # debug(self.profiles)

    def info_from_steam64_id(self, steam64_ids):
        fields = (
            'steamid',
            'personaname',
            'profileurl',
            'realname',
            'timecreated',
            'loccountrycode',
            'locstatecode',
            'loccityid',
            'community_id',
            'communityvisibilitystate'
        )

        if not hasattr(steam64_ids, '__iter__'):
            steam64_ids = [steam64_ids]

        url = self.USER_API.format(
            api_base=self.API_BASE,
            api_key=self.config.api_key,
            steam_id=",".join([str(s) for s in steam64_ids]))
        r = requests.get(url)
        if r.status_code != 200:
            print(json.dumps({"info_error": (r.status_code, r.text)}))
            exit(1)
        self.calls_made += 1
        response = r.json()
        for player in response['response']['players']:
            if not self.profiles[player["steamid"]]["personaname"]:
                profile = self.profiles[player["steamid"]]
                for field in fields:
                    profile[field] = player.get(field)
                if "/id/" in profile['profileurl']:
                    url = profile['profileurl']
                    profile["community_id"] = url[url.index("/id/") + len("/id/"):-1]

                del profile['profileurl']

    def fetch_profile_info(self):

        nameless = [p for p in self.profiles if len(self.profiles[p]["personaname"]) == 0]
        self.max_threads = int(math.ceil(len(nameless)/99))

        groups = [[] for _ in range(self.max_threads)]
        for idx, profile in enumerate(nameless):
            groups[int(idx - self.max_threads * (idx // self.max_threads))].append(profile)

        executor = concurrent.futures.ThreadPoolExecutor(self.max_threads)
        futures = [
            executor.submit(self.info_from_steam64_id, group) for group in groups
        ]
        concurrent.futures.wait(futures)

    def fetch_friends(self, profiles):
        for profile in profiles:
            url = self.FRIEND_API.format(
                api_base=self.API_BASE,
                api_key=self.config.api_key,
                steam_id=profile)

            r = requests.get(url)
            if r.status_code != 200:
                self.error_profiles.add(profile)
                print(json.dumps({"friend_error": (r.status_code, r.text)}))
                time.sleep(0.5)
                continue
            self.calls_made += 1
            response = r.json()
            friends = response["friendslist"]["friends"]
            for friend in friends:
                self.profiles[profile]["friends"].append((friend["steamid"], friend["friend_since"]))
                if friend["steamid"] not in self.profiles:
                    self.profiles[friend["steamid"]] = {"personaname": "", "friends": []}

    def mass_fetch_friends(self):
        friendless = [p for p in self.profiles if len(self.profiles[p]["friends"]) == 0]
        groups = [[] for _ in range(self.max_threads)]
        for idx, profile in enumerate(friendless):
            groups[int(idx - self.max_threads * (idx // self.max_threads))].append(profile)

        executor = concurrent.futures.ThreadPoolExecutor(self.max_threads)
        futures = [
            executor.submit(self.fetch_friends, group) for group in groups
        ]
        concurrent.futures.wait(futures)

    def update_401(self):
        query = (
            "UPDATE Profiles "
            "SET error_cnt = error_cnt + 1 "
            "WHERE id in ({})").format(",".join(["%s"] * len(self.error_profiles)))
        print(list(map(str, self.error_profiles)))
        print(query)
        with self.db.cursor() as cursor:
            cursor.execute(query, list(map(str, self.error_profiles)))


class SteamFriendDataDB:
    profiles = {}
    depth = 1
    checked_ids = set()
    warning_printed = False
    c = None
    threads = []
    times = {}

    def timeit(self, s=""):
        if s in self.times:
            print(s, time.time() - self.times[s])
            del self.times[s]
        else:
            self.times[s] = time.time()

    def __init__(self, user, depth=1):
        from crawler import Crawler
        self.c = Crawler(verbose=False)
        self.user = user
        self.depth = depth
        self.config = Config()
        self.profiles[str(user)] = {"personaname": "", "friends": []}
        self.db = MySQLdb.connect(
            host=self.config.db_host,
            user=self.config.db_user,
            passwd=self.config.db_pw,
            db=self.config.db
        )
        self.check_db([user])
        self.calls_made = 0
        self.fetch_friends([str(user)])
        for _ in range(int(self.depth)):
            self.mass_fetch_friends()
        self.fetch_profile_info()
        #debug(self.profiles)

    def check_db(self, users):
        users = list(set(users).difference(self.checked_ids))
        if not users:
            return True
        query = ("SELECT any_value(Profiles.id), any_value(communityvisibilitystate), id_profile, any_value(error_cnt) "
                 "FROM Profiles LEFT JOIN Friends ON Profiles.id = id_profile "
                 "WHERE Profiles.id in ({}) GROUP BY id_profile").format(",".join(["%s"] * len(users)))
        with self.db.cursor() as cursor:
            try:
                cursor.execute(query, users)
            except MySQLdb.Error as e:
                print(str(e))
                print(cursor._last_executed)
                exit(1)
            data = cursor.fetchall()
        for row in data:
            if row[2] == 3 and row[3] is None and row[4] < 2:
                if not self.warning_printed:
                    print(json.dumps({"message": "crawling"}))
                    self.warning_printed = True
                self.c.crawl(row[0], depth=1)
                self.checked_ids.add(str(row[0]))
            else:
                self.checked_ids.add(str(row[0]))
        users = list(set(users).difference(self.checked_ids))
        for user in users:
            if not user:
                continue
            self.c.crawl(user, depth=1)
            self.checked_ids.add(str(user))
        return True

    def info_from_steam64_id(self, steam64_ids):

        fields = (
            'steamid',
            'personaname',
            'profileurl',
            'realname',
            'timecreated',
            'loccountrycode',
            'locstatecode',
            'loccityid',
            'community_id'
        )

        if not hasattr(steam64_ids, '__iter__'):
            steam64_ids = [steam64_ids]
        complete_data = []
        for ids in grouper(steam64_ids, 500):
            true_ids = [i for i in ids if i is not None]
            query = ("SELECT id as steamid, personaname, realname, timecreated, loccountrycode, community_id "
                     "FROM Profiles "
                     "WHERE id in ({})").format(','.join(['%s'] * len(true_ids)))
            with self.db.cursor(MySQLdb.cursors.DictCursor) as cursor:
                cursor.execute(query, true_ids)
                data = cursor.fetchall()
            complete_data.extend(data)

        for row in complete_data:
            if not self.profiles[str(row["steamid"])]["personaname"]:
                profile = self.profiles[str(row["steamid"])]
                for field in fields:
                    try:
                        profile[field] = row.get(field, bytes("", encoding="utf-8")).decode()
                    except (AttributeError, TypeError) as e:
                        profile[field] = str(row.get(field, ""))

    def fetch_profile_info(self):

        nameless = [p for p in self.profiles if len(self.profiles[p]["personaname"]) == 0]
        self.info_from_steam64_id(nameless)

    def fetch_friends(self, profiles):
        complete_data = []
        for profile in grouper(profiles, 500):
            true_profiles = [i for i in profile if i is not None]
            query = ("SELECT any_value(id_profile), "
                     "GROUP_CONCAT(CONCAT(CAST(id_friend AS char),'_',CAST(friend_since AS char))) "
                     "FROM Friends "
                     "WHERE id_profile in ({}) "
                     "GROUP BY id_profile").format(','.join(["%s"] * len(true_profiles)))
            with self.db.cursor() as cursor:
                cursor.execute(query, true_profiles)
                data = cursor.fetchall()
            complete_data.extend(data)

        for row in complete_data:
            for friend in row[1].split(","):
                steamid, friend_since = friend.split("_")
                self.profiles[str(row[0])]["friends"].append((steamid, friend_since))
                if steamid not in self.profiles:
                    self.profiles[steamid] = {"personaname": "", "friends": []}

    def mass_fetch_friends(self):
        friendless = [p for p in self.profiles if len(self.profiles[p]["friends"]) == 0]
        self.fetch_friends(friendless)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--user')
    args = parser.parse_args()
    tmp_steam64_id = 76561198022211564
    # tmp_steam64_id = 76561198017924701
    sfg = SteamFriendDataDB(tmp_steam64_id, depth=1)
