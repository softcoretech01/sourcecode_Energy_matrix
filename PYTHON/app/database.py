import pymysql
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "masters")
DB_NAME_SOLAR = os.getenv("DB_NAME_SOLAR", "solar")
DB_NAME_WINDMILL = os.getenv("DB_NAME_WINDMILL", "windmill")

CONNECT_TIMEOUT = 10
READ_TIMEOUT = 30

# Initial database creation is now handled inside initialize_database()

# Escape password for connection URL
db_password_escaped = quote_plus(DB_PASSWORD)

# SQLAlchemy Engines & Session configuration
engine_masters = create_engine(
    f"mysql+pymysql://{DB_USER}:{db_password_escaped}@{DB_HOST}/{DB_NAME}",
    connect_args={"connect_timeout": CONNECT_TIMEOUT, "read_timeout": READ_TIMEOUT}
)
engine_windmill = create_engine(
    f"mysql+pymysql://{DB_USER}:{db_password_escaped}@{DB_HOST}/{DB_NAME_WINDMILL}",
    connect_args={"connect_timeout": CONNECT_TIMEOUT, "read_timeout": READ_TIMEOUT}
)
engine_solar = create_engine(
    f"mysql+pymysql://{DB_USER}:{db_password_escaped}@{DB_HOST}/{DB_NAME_SOLAR}",
    connect_args={"connect_timeout": CONNECT_TIMEOUT, "read_timeout": READ_TIMEOUT}
)

SessionLocalMasters = sessionmaker(autocommit=False, autoflush=False, bind=engine_masters)
SessionLocalWindmill = sessionmaker(autocommit=False, autoflush=False, bind=engine_windmill)
SessionLocalSolar = sessionmaker(autocommit=False, autoflush=False, bind=engine_solar)

# Bases for models to inherit from
BaseMasters = declarative_base()
BaseWindmill = declarative_base()
BaseSolar = declarative_base()

def get_db():
    db = SessionLocalWindmill()
    try:
        yield db
    finally:
        db.close()

def get_db_solar():
    db = SessionLocalSolar()
    try:
        yield db
    finally:
        db.close()

def get_connection(db_name=None):
    """
    Returns a native pymysql connection. 
    Defaults to DB_NAME since most routers interact with it.
    """
    if db_name is None:
        db_name = DB_NAME
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=db_name,
        autocommit=False,
        connect_timeout=CONNECT_TIMEOUT,
        read_timeout=READ_TIMEOUT
    )

def initialize_database():
    """Ensure database, tables, and stored procedures exist on startup."""
    
    # 0. Initial pure pymysql connection to ensure DBs exist
    try:
        init_conn = pymysql.connect(
            host=DB_HOST, 
            user=DB_USER, 
            password=DB_PASSWORD, 
            autocommit=True,
            connect_timeout=CONNECT_TIMEOUT,
            read_timeout=READ_TIMEOUT
        )
        init_cursor = init_conn.cursor()
        init_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        init_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME_WINDMILL}")
        init_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME_SOLAR}")
        init_cursor.close()
        init_conn.close()
        print("Databases ensure/created.")
    except Exception as e:
        print(f"Failed to ensure databases on startup: {e}")

    # IMPORT all models here to register them with metadata
    from app.models import customer_masters, master_models, windmill_masters, windmill_models
    
    # 1. Create all Tables based on defined models
    print("Creating SQLAlchemy tables for Masters...")
    BaseMasters.metadata.create_all(bind=engine_masters)
    print("Creating SQLAlchemy tables for Windmill...")
    BaseWindmill.metadata.create_all(bind=engine_windmill)
    print("All SQLAlchemy tables have been created.")

    # 1b. ensure certain columns can store longer values
    try:
        with get_connection().cursor() as cur:
            cur.execute("ALTER TABLE master_customers MODIFY phone_no VARCHAR(50)")
            print("Altered master_customers.phone_no to VARCHAR(50)")
    except Exception:
        # might not exist yet or already correct; ignore
        pass

    try:
        with get_connection().cursor() as cur:
            # service_number can exceed 32-bit signed int; use BIGINT to avoid out-of-range errors
            cur.execute("ALTER TABLE customer_service MODIFY service_number BIGINT")
            print("Altered customer_service.service_number to BIGINT")
    except Exception:
        # might not exist yet or already correct; ignore
        pass
    
    # 2. Initialize Stored Procedures from the stored_procedure folder
    sp_dir = os.path.join(os.path.dirname(__file__), "stored_procedure")
    if os.path.exists(sp_dir):
        # We now organize SPs into subdirectories named after the database
        db_map = {
            "masters": DB_NAME,
            "windmill": DB_NAME_WINDMILL
        }

        for folder_name, db_to_init in db_map.items():
            folder_path = os.path.join(sp_dir, folder_name)
            if not os.path.exists(folder_path):
                continue
                
            try:
                conn = get_connection(db_name=db_to_init)
                cursor = conn.cursor()
                print(f"Initializing stored procedures for database: {db_to_init} from folder: {folder_name}")
                
                for filename in os.listdir(folder_path):
                    if filename.endswith(".sql"):
                        file_path = os.path.join(folder_path, filename)
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                            
                            # Robustly detect and handle delimiters (// or $$)
                            import re
                            
                            # Standardize to // or $$ or just ;
                            delimiter = ';'
                            if 'DELIMITER //' in content:
                                delimiter = '//'
                            elif 'DELIMITER $$' in content:
                                delimiter = '$$'
                                
                            # Remove DELIMITER lines
                            content = re.sub(r"DELIMITER\s+\S+", "", content)
                            content = re.sub(r"DELIMITER\s+;", "", content) # Ensure ; is cleaned if present
                            
                            # Split by the detected delimiter
                            statements = content.split(delimiter)
                            
                            for statement in statements:
                                clean_statement = statement.strip()
                                # Remove any trailing delimiter character that might have been missed
                                if clean_statement.endswith(';'):
                                    clean_statement = clean_statement[:-1].strip()
                                
                                if clean_statement:
                                    try:
                                        cursor.execute(clean_statement)
                                    except Exception as e:
                                        print(f"Error executing SP from {filename} in {db_to_init}: {e}")
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as dbe:
                print(f"Failed to connect to {db_to_init} for SP initialization: {dbe}")
        print("Stored procedures initialization complete.")