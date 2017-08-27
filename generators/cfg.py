import json


class Config:
    api_key = None
    db_host = None
    db_pw = None
    db_user = None
    db_table_profile = None
    db_table_friends = None
    db = None

    def __init__(self):
        with open('../cfg/cfg.json', 'r') as f:
            config = json.loads(f.read())
            for name, value in config.items():
                setattr(self, name, value)
