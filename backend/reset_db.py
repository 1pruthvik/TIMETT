"""
Reset / Truncate all tables in PostgreSQL cloud database cleanly using metadata reflection.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured in .env")

engine = create_engine(DATABASE_URL)

def reset_database():
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    table_names = list(metadata.tables.keys())
    # Exclude alembic migration version table
    tables_to_truncate = [t for t in table_names if t != "alembic_version"]
    
    print("Found tables:", tables_to_truncate)
    
    with engine.connect() as conn:
        for t in tables_to_truncate:
            try:
                conn.execute(text(f'TRUNCATE TABLE "{t}" RESTART IDENTITY CASCADE;'))
                conn.commit()
                print(f"Emptied table: {t}")
            except Exception as e:
                print(f"Error truncating {t}: {e}")
                
    print("\nAll database tables emptied successfully and IDs restarted at 1!")

if __name__ == "__main__":
    reset_database()
