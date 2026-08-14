import uuid
from app.database import db_manager
from app.auth.security import hash_password


def seed_users():
    users_to_seed = [
        {
            "id": "usr_admin_001",
            "email": "admin@extractiontools.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "System Administrator"
        },
        {
            "id": "usr_demo_002",
            "email": "demo@extractiontools.com",
            "username": "demo",
            "password": "demo123",
            "full_name": "Demo User"
        }
    ]

    for u in users_to_seed:
        existing = db_manager.get_user_by_email_or_username(u["username"])
        if not existing:
            hashed = hash_password(u["password"])
            db_manager.create_user(
                user_id=u["id"],
                email=u["email"],
                username=u["username"],
                hashed_password=hashed,
                full_name=u["full_name"]
            )
            print(f"Created user: {u['username']} / {u['password']}")
        else:
            print(f"User {u['username']} already exists.")


if __name__ == "__main__":
    seed_users()
