from datetime import datetime
from peewee import *

db = SqliteDatabase('activity_log.db')

class BaseModel(Model):
    class Meta:
        database = db

class ActivityLog(BaseModel):
    timestamp = DateTimeField(default=datetime.now)
    process_name = CharField()
    window_title = CharField()
    category = CharField()  # 'Study', 'Game', 'Video', 'Idle', 'Other'
    duration_seconds = IntegerField(default=0)

def init_db():
    db.connect()
    db.create_tables([ActivityLog])
    print("Database initialized.")

if __name__ == '__main__':
    init_db()
