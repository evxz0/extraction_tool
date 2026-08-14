import sqlite3
import os
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

if os.environ.get("VERCEL"):
    DB_FILE = "/tmp/data.db"
else:
    DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data.db")


class DatabaseManager:
    """Manages database access, supporting Supabase or local SQLite storage."""
    def __init__(self):
        self.supabase = None
        self.is_supabase = False
        self._init_db()

    def _init_db(self):
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.is_supabase = True
                logger.info("Supabase client initialized successfully.")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to SQLite.")

        # Initialize SQLite fallback database
        self._init_sqlite()

    def _init_sqlite(self):
        os.makedirs(os.path.dirname(os.path.abspath(DB_FILE)), exist_ok=True)
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    full_name TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS password_resets (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            """)
            conn.commit()
        logger.info(f"SQLite database initialized at {DB_FILE}")

    def get_user_by_email_or_username(self, identifier: str) -> Optional[Dict[str, Any]]:
        identifier = identifier.strip().lower()
        if self.is_supabase:
            try:
                res = self.supabase.table("users").select("*").or_(f"email.eq.{identifier},username.eq.{identifier}").limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error fetching user: {e}")

        # SQLite lookup
        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?", (identifier, identifier))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.is_supabase:
            try:
                res = self.supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error fetching user by ID: {e}")

        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def create_user(self, user_id: str, email: str, username: str, hashed_password: str, full_name: str = "") -> bool:
        if self.is_supabase:
            try:
                self.supabase.table("users").insert({
                    "id": user_id,
                    "email": email.lower(),
                    "username": username.lower(),
                    "hashed_password": hashed_password,
                    "full_name": full_name,
                    "is_active": True
                }).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase create_user error: {e}")

        try:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO users (id, email, username, hashed_password, full_name, is_active) VALUES (?, ?, ?, ?, ?, 1)",
                    (user_id, email.lower(), username.lower(), hashed_password, full_name)
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite create_user error: {e}")
            return False

    def update_password(self, user_id: str, hashed_password: str) -> bool:
        if self.is_supabase:
            try:
                self.supabase.table("users").update({"hashed_password": hashed_password}).eq("id", user_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase update_password error: {e}")

        try:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (hashed_password, user_id))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite update_password error: {e}")
            return False

    def store_password_reset_token(self, reset_id: str, user_id: str, token: str, expires_at: str) -> bool:
        if self.is_supabase:
            try:
                self.supabase.table("password_resets").insert({
                    "id": reset_id,
                    "user_id": user_id,
                    "token": token,
                    "expires_at": expires_at,
                    "used": False
                }).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase password_reset insert error: {e}")

        try:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO password_resets (id, user_id, token, expires_at, used) VALUES (?, ?, ?, ?, 0)",
                    (reset_id, user_id, token, expires_at)
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite password_reset insert error: {e}")
            return False

    def get_password_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        if self.is_supabase:
            try:
                res = self.supabase.table("password_resets").select("*").eq("token", token).eq("used", False).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_password_reset error: {e}")

        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM password_resets WHERE token = ? AND used = 0", (token,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def mark_reset_token_used(self, token: str) -> bool:
        if self.is_supabase:
            try:
                self.supabase.table("password_resets").update({"used": True}).eq("token", token).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase mark_reset_token_used error: {e}")

        try:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE password_resets SET used = 1 WHERE token = ?", (token,))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite mark_reset_token_used error: {e}")
            return False


db_manager = DatabaseManager()
