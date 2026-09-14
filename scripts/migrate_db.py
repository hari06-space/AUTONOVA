#!/usr/bin/env python3
import sys
import time
import pymssql

# Database Configurations
REMOTE_CONFIG = {
    'server': '192.168.1.28',
    'user': 'nutech',
    'password': 'nutech@2026',
    'database': 'AUTONOMA'
}

LOCAL_CONFIG = {
    'server': 'localhost',
    'port': 1433,
    'user': 'SA',
    'password': 'nutech@2026',
    'database': 'AUTONOMA'
}

BATCH_SIZE = 2000

def main():
    print("====================================================")
    print("🚀 Starting AUTONOMA Database Migration Script")
    print(f"From Remote: {REMOTE_CONFIG['server']}")
    print(f"To Local:    {LOCAL_CONFIG['server']}:{LOCAL_CONFIG['port']}")
    print("====================================================")

    start_time = time.time()
    
    try:
        # Establish remote connection
        print("Connecting to remote database...")
        conn_remote = pymssql.connect(**REMOTE_CONFIG)
        cur_remote = conn_remote.cursor()
        cur_remote.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
        print("✅ Remote connection established successfully!")

        # Establish local connection
        print("Connecting to local database...")
        conn_local = pymssql.connect(**LOCAL_CONFIG)
        cur_local = conn_local.cursor()
        print("✅ Local connection established successfully!")

    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)

    try:
        # 1. Fetch remote tables
        cur_remote.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_NAME NOT IN ('sysdiagrams')
            ORDER BY TABLE_NAME
        """)
        remote_tables = [row[0] for row in cur_remote.fetchall()]
        print(f"Found {len(remote_tables)} tables in remote database.")

        # 2. Fetch local tables to verify existence
        cur_local.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        """)
        local_tables = set(row[0] for row in cur_local.fetchall())
        print(f"Found {len(local_tables)} tables in local database.")

        # 3. Globally disable constraints and triggers on local database
        print("\nGlobally disabling foreign keys and triggers on local database...")
        cur_local.execute("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'")
        cur_local.execute("EXEC sp_MSforeachtable 'DISABLE TRIGGER ALL ON ?'")
        conn_local.commit()
        print("✅ Constraints and triggers disabled.")

        print("\n--- Starting Table Copy ---")
        
        success_count = 0
        skipped_count = 0
        failed_tables = []

        for index, table in enumerate(remote_tables, start=1):
            if table not in local_tables:
                print(f"⚠️ [{index}/{len(remote_tables)}] Skipping {table} (does not exist locally)")
                skipped_count += 1
                continue

            has_identity = False
            try:
                # Get remote columns
                cur_remote.execute(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'")
                cols_remote = set(row[0] for row in cur_remote.fetchall())

                # Get local columns
                cur_local.execute(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'")
                cols_local = set(row[0] for row in cur_local.fetchall())

                # Case-insensitive column matching
                cols_remote_lower = {c.lower(): c for c in cols_remote}
                cols_local_lower = {c.lower(): c for c in cols_local}
                
                # Perform set intersection by casting dict_keys to sets
                common_lower = set(cols_remote_lower.keys()).intersection(set(cols_local_lower.keys()))
                
                # Use local column names/casing for consistency
                common_cols = sorted([cols_local_lower[cl] for cl in common_lower])
                
                if not common_cols:
                    print(f"⚠️ [{index}/{len(remote_tables)}] Skipping {table} (no common columns)")
                    skipped_count += 1
                    continue

                # Check if table has an identity column
                cur_local.execute(f"SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('{table}') AND is_identity = 1")
                identity_cols = cur_local.fetchall()
                has_identity = len(identity_cols) > 0
                identity_col_name = identity_cols[0][0] if has_identity else None

                # Query row count from remote
                cur_remote.execute(f"SELECT COUNT(*) FROM [{table}]")
                remote_rows_count = cur_remote.fetchone()[0]

                print(f"⏳ [{index}/{len(remote_tables)}] Copying {table} ({remote_rows_count} rows)...", end="", flush=True)

                # Clear local table
                cur_local.execute(f"DELETE FROM [{table}]")

                if remote_rows_count == 0:
                    conn_local.commit()
                    print(" Done (0 rows).")
                    success_count += 1
                    continue

                # Fetch all rows from remote using the matched columns
                cols_str = ', '.join([f'[{c}]' for c in common_cols])
                cur_remote.execute(f"SELECT {cols_str} FROM [{table}]")
                rows = cur_remote.fetchall()

                # Set identity insert on if needed
                if has_identity:
                    cur_local.execute(f"SET IDENTITY_INSERT [{table}] ON")

                placeholders = ', '.join(['%s'] * len(common_cols))
                insert_sql = f"INSERT INTO [{table}] ({cols_str}) VALUES ({placeholders})"

                # Insert in batches
                for i in range(0, len(rows), BATCH_SIZE):
                    batch = rows[i:i+BATCH_SIZE]
                    cur_local.executemany(insert_sql, batch)

                conn_local.commit()
                print(f" Done ({len(rows)} rows copied).")
                success_count += 1

            except Exception as ex:
                conn_local.rollback()
                print(f" Failed! Error: {ex}")
                failed_tables.append((table, str(ex)))
            finally:
                if has_identity:
                    try:
                        cur_local.execute(f"SET IDENTITY_INSERT [{table}] OFF")
                        conn_local.commit()
                    except Exception:
                        pass

        # 4. Globally re-enable constraints and triggers
        print("\nGlobally re-enabling local constraints and triggers...")
        try:
            cur_local.execute("EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL'")
            cur_local.execute("EXEC sp_MSforeachtable 'ENABLE TRIGGER ALL ON ?'")
            conn_local.commit()
            print("✅ All constraints and triggers globally re-enabled successfully.")
        except Exception as ex:
            print(f"⚠️ Warning during global constraint enablement: {ex}")

        # Summary
        end_time = time.time()
        elapsed = end_time - start_time
        print("\n====================================================")
        print("📊 Migration Summary")
        print(f"Time Taken:      {elapsed:.2f} seconds")
        print(f"Tables Copied:   {success_count}")
        print(f"Tables Skipped:  {skipped_count}")
        print(f"Tables Failed:   {len(failed_tables)}")
        
        if failed_tables:
            print("\n❌ Failed Tables Detail:")
            for ft, err in failed_tables:
                print(f"  - {ft}: {err}")
        else:
            print("🎉 Database migration completed with zero errors!")
        print("====================================================")

    finally:
        # Final safety check to make sure constraints are re-enabled if script crashed midway
        try:
            cur_local.execute("EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL'")
            cur_local.execute("EXEC sp_MSforeachtable 'ENABLE TRIGGER ALL ON ?'")
            conn_local.commit()
        except Exception:
            pass
        conn_remote.close()
        conn_local.close()

if __name__ == '__main__':
    main()
