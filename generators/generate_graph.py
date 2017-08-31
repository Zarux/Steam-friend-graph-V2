from fetch_steam_data import SteamFriendData, SteamFriendDataDB, debug
import argparse
import json


class Graph:

    nodes = []
    edges = []
    graph = {}

    def __init__(self, user, dump=True, depth=1, force_api=False, locate=None):
        if force_api:
            sfd = SteamFriendData(user, depth=depth)
        else:
            sfd = SteamFriendDataDB(user, depth=depth)
            sfd.check_db([locate])
        self.graph_data = sfd.profiles
        if locate is not None:
            self.user = user
            self.target = locate
            self.locator()
        else:
            self.generate()
        if dump:
            self.dump()

    def dump(self):
        print(json.dumps(self.graph))

    def bfs_shortest_path(self, source, target):
        pass

    def locator(self):
        shortest_path = self.dijkstra(self.user, self.target)
        print(shortest_path)

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
    args = parser.parse_args()
    g = Graph(args.user, dump=args.print, depth=args.depth, force_api=args.force_api, locate=args.locate)
