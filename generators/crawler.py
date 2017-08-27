import time
from multiprocessing import Queue

import MySQLdb

from cfg import Config
from fetch_steam_data import SteamFriendData, debug


class Crawler:
    total_calls_made = 0
    max_threads = 1
    verbose = True

    def __init__(self, verbose=True):
        self.config = Config()
        self.verbose = verbose
        self.db = MySQLdb.connect(
            host=self.config.db_host,
            user=self.config.db_user,
            passwd=self.config.db_pw,
            db=self.config.db
        )
        self.q = Queue()
        self.db.autocommit(on=True)
        self.db.set_character_set('utf8')
        with self.db.cursor() as dbc:
            dbc.execute('SET NAMES utf8;')
            dbc.execute('SET CHARACTER SET utf8;')
            dbc.execute('SET character_set_connection=utf8;')

    def db_insert(self, data):
        db = self.db

        for steam_id, profile in data.profiles.items():
            query = (
                "INSERT INTO Profiles("
                "id, personaname, realname, timecreated, loccountrycode, "
                "locstatecode, loccityid, last_checked, community_id, communityvisibilitystate, error_cnt)"
                "VALUES (%s, %s, %s, %s, %s, %s, %s, unix_timestamp(), %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE "
                "personaname = VALUES(personaname), realname = VALUES(realname), "
                "timecreated = VALUES(timecreated), loccountrycode = VALUES (loccountrycode), "
                "locstatecode = VALUES(locstatecode), loccityid = VALUES(loccityid), "
                "last_checked = unix_timestamp(), community_id = VALUES (community_id), "
                "communityvisibilitystate = VALUES(communityvisibilitystate), error_cnt = error_cnt + VALUES(error_cnt)"
            )

            with db.cursor() as cursor:
                try:
                    cursor.execute(query, (
                        steam_id,
                        profile["personaname"],
                        profile.get("realname"),
                        profile.get("timecreated"),
                        profile.get("loccountrycode"),
                        profile.get("locstatecode"),
                        profile.get("loccityid"),
                        str(profile.get("community_id")),
                        profile.get("communityvisibilitystate"),
                        1 if steam_id in data.error_profiles else 0
                    ))
                except MySQLdb.Error as e:
                    print(str(e))
                    print(cursor._last_executed)
                    exit(1)
                except (Warning, MySQLdb.Warning) as w:
                    pass
                else:
                    db.commit()

            if profile["friends"]:
                query = "UPDATE Profiles SET last_checked_friends = unix_timestamp(), error_cnt = 0 WHERE id = %s"
                with db.cursor() as cursor:
                    try:
                        cursor.execute(query, (steam_id, ))
                    except MySQLdb.Error as e:
                        print(str(e))
                        print(cursor._last_executed)
                        exit(1)

                query = "DELETE From Friends WHERE id_profile = %s"
                with db.cursor() as cursor:
                    try:
                        cursor.execute(query, (steam_id, ))
                    except MySQLdb.Error as e:
                        print(str(e))
                        print(cursor._last_executed)
                        exit(1)

                query = "INSERT INTO Friends(id_profile, id_friend, friend_since) VALUES"
                params = []
                for friend, friend_since in profile["friends"]:
                    query += "(%s, %s, %s), "
                    params += [steam_id, friend, friend_since]
                query = query.strip(', ')
                query += " ON DUPLICATE KEY UPDATE friend_since=friend_since"
                with db.cursor() as cursor:
                    try:
                        cursor.execute(query, params)
                    except MySQLdb.Error as e:
                        print(str(e))
                        print(cursor._last_executed)
                        exit(1)
                    else:
                        db.commit()

        db.commit()

    def crawl(self, user, depth=0):
        data = SteamFriendData(user, depth=depth)
        if self.verbose:
            print("Got data for", user, len(data.profiles))
        self.total_calls_made += data.calls_made
        self.db_insert(data)
        if self.verbose:
            print("Calls made now/total", data.calls_made, self.total_calls_made)
        if self.total_calls_made >= 90000:
            exit(0)

    def get_next_users(self):
        query = (
            "SELECT id, personaname FROM Profiles "
            "WHERE id NOT IN (SELECT DISTINCT id_profile as id FROM Friends) "
            "AND unix_timestamp() - last_checked > 30 "
            "AND (communityvisibilitystate = 3 OR communityvisibilitystate is NULL ) "
            "AND last_checked_friends < unix_timestamp() - 86400*7*4 "
            "LIMIT 10000;"
        )

        with self.db.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchall()

        for row in data:
            if self.verbose:
                print(row[1])
            self.crawl(row[0])

        if self.total_calls_made >= 99000:
            if self.verbose:
                print("Sleeping")
            time.sleep(86400)


if __name__ == '__main__':
    c = Crawler(verbose=True)
    c.get_next_users()
    #c.crawl(76561198137331965, depth=1)
