from fetch_steam_data import SteamFriendData, SteamFriendDataDB, debug
import argparse
import json
from collections import defaultdict


class Graph:

    nodes = []
    edges = []
    graph = {}

    def __init__(self, user, dump=True, depth=1, force_api=False):
        if force_api:
            sfd = SteamFriendData(user, depth=depth)
        else:
            sfd = SteamFriendDataDB(user, depth=depth)
        self.graph_data = sfd.profiles
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
    parser.add_argument('-d', '--depth', default=1)
    parser.add_argument('-f', '--force_api', action='store_true', default=False)
    parser.add_argument('-p', '--print', action='store_true', default=False)
    args = parser.parse_args()
    g = Graph(args.user, dump=args.print, depth=args.depth, force_api=args.force_api)
