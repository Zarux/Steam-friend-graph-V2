from fetch_steam_data import SteamFriendData, SteamFriendDataDB, debug
import argparse
import json


class Graph:

    nodes = []
    edges = []
    graph = {}

    def __init__(self, user, dump=True, depth=1, force_api=False, locate=None, join=None, force_degree=False):
        self.force_degree = force_degree
        if force_api:
            sfd = SteamFriendData(user, depth=depth)
        else:
            sfd = SteamFriendDataDB(user, depth=depth)

        self.graph_data = sfd.profiles

        if join:
            joined = join.split(",")
            for profile in joined:
                jfd = SteamFriendDataDB(profile, depth=depth)
                self.graph_data.update(jfd.profiles)

        self.generate()
        if dump:
            self.dump()

    def dump(self):
        print(json.dumps(self.graph))

    def generate(self):
        for steam_id, node in self.graph_data.items():
            if not node["personaname"]:
                continue
            label = "%s" % node["personaname"]
            label += "( %s ) ( %s )" % (node.get("realname"), node.get("loccountrycode"))

            self.nodes.append({
                "id": steam_id,
                "label": "%s" % label,
                **node
            })

            for friend, friend_since in node["friends"]:
                self.edges.append({
                    "id": "%s-%s" % (steam_id, friend),
                    "source": steam_id,
                    "target": friend,
                    "friend_since": friend_since
                })

        self.graph = {
            "nodes": self.nodes,
            "edges": self.edges
        }
        return self.graph


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--user', required=True)
    parser.add_argument('-d', '--depth', default=1, type=int)
    parser.add_argument('-f', '--force_api', action='store_true', default=False)
    parser.add_argument('-p', '--print', action='store_true', default=False)
    parser.add_argument('-l', '--locate')
    parser.add_argument('-j', '--join')
    parser.add_argument('-fd', '--force-degree', action='store_true', default=False)
    args = parser.parse_args()
    g = Graph(args.user,
              dump=args.print,
              depth=args.depth,
              force_api=args.force_api,
              locate=args.locate,
              join=args.join,
              force_degree=args.force_degree
              )
