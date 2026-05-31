import psycopg2
from config import DB_CONFIG

print("Loaded config:")
print(DB_CONFIG)

class DB:
    conn = None

    @staticmethod
    def get_connection():
        try:
            if DB.conn is None or DB.conn.closed:
                DB.conn = psycopg2.connect(
                    host=DB_CONFIG["host"],
                    port=int(DB_CONFIG["port"]),
                    database=DB_CONFIG["database"],
                    user=DB_CONFIG["user"],
                    password=DB_CONFIG["password"]
                )
                print("Database connected (persistent)")

            return DB.conn

        except Exception as e:
            print("Database error:")
            print(e)
            return None