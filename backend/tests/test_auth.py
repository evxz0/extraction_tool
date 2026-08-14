import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.redis_client import session_redis
from app.database import db_manager
from app.auth.security import hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_teardown():
    session_redis.flush_all()
    # Seed test user
    test_user = db_manager.get_user_by_email_or_username("testuser")
    if not test_user:
        db_manager.create_user(
            user_id="usr_test_999",
            email="testuser@example.com",
            username="testuser",
            hashed_password=hash_password("password123"),
            full_name="Test User"
        )
    yield
    session_redis.flush_all()


def test_login_success():
    res = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"
    assert session_redis.exists("session:user:usr_test_999") == 1


def test_1_device_session_locking():
    # 1. First device logs in
    res1 = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123"})
    assert res1.status_code == 200
    token1 = res1.json()["access_token"]

    # 2. Second device attempts to log in without force_login -> must be rejected (409 Conflict)
    res2 = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123", "force_login": False})
    assert res2.status_code == 409
    assert "sedang aktif di perangkat lain" in res2.json()["detail"]

    # 3. First token is still valid
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert res_me.status_code == 200

    # 4. Second device logs in with force_login = True -> succeeds and overrides session
    res3 = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123", "force_login": True})
    assert res3.status_code == 200
    token2 = res3.json()["access_token"]
    assert token2 != token1

    # 5. First device token is now invalid (401)
    res_me_old = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert res_me_old.status_code == 401

    # 6. Second device token works
    res_me_new = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token2}"})
    assert res_me_new.status_code == 200


def test_logout_releases_lock():
    # 1. Login
    res = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123"})
    token = res.json()["access_token"]

    # 2. Logout
    res_logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res_logout.status_code == 200

    # 3. Session key should be deleted in Redis
    assert session_redis.exists("session:user:usr_test_999") == 0

    # 4. Subsequent login succeeds immediately without conflict
    res_login_again = client.post("/api/auth/login", json={"identifier": "testuser", "password": "password123"})
    assert res_login_again.status_code == 200
