import io
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.redis_client import session_redis
from app.database import db_manager
from app.auth.security import hash_password
from app.tools.matcher import solve_subset_sum
from app.tools.recap import parse_recap_log, generate_dual_sheet_excel
from app.tools.extractor import extract_from_text, extract_from_dataframe
import pandas as pd

client = TestClient(app)


@pytest.fixture
def auth_headers():
    session_redis.flush_all()
    # Ensure admin user exists
    admin_user = db_manager.get_user_by_email_or_username("admin")
    if not admin_user:
        db_manager.create_user(
            user_id="usr_admin_001",
            email="admin@extractiontools.com",
            username="admin",
            hashed_password=hash_password("admin123"),
            full_name="Administrator"
        )
    # Login admin
    res = client.post("/api/auth/login", json={"identifier": "admin", "password": "admin123", "force_login": True})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# TOOL 1 TESTS
# ============================================================================

def test_tool1_extractor_text():
    sample_text = """
    2024-10-15 14:30:00 | USER: U1001 | OUTLET: Toko Sumber Rejeki | Rp 150.000,00
    2024-10-15 15:45:12 | USER: U1002 | OUTLET: Warung Berkah | IDR 250.000
    2024-10-15 16:10:00 | USER: U1001 | OUTLET: Toko Sumber Rejeki | 750.000,00
    """
    results = extract_from_text(sample_text, target_user_id="U1001")
    assert len(results) == 2
    assert results[0]["amount"] == 150000.0
    assert results[0]["user_id"] == "U1001"
    assert "Toko Sumber Rejeki" in results[0]["outlet_name"]
    assert results[1]["amount"] == 750000.0


def test_tool1_extractor_api(auth_headers):
    csv_content = b"Waktu,User_ID,Nominal,Merchant\n14:00,USR01,500000,Cafe Kopi\n15:00,USR02,750000,Resto Enak"
    files = {"file": ("transactions.csv", csv_content, "text/csv")}
    data = {"target_user_id": "USR01"}
    
    res = client.post("/api/tools/extractor/extract", files=files, data=data, headers=auth_headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["total_extracted"] == 1
    assert res_data["data"][0]["amount"] == 500000.0


# ============================================================================
# TOOL 2 TESTS (SUBSET SUM)
# ============================================================================

def test_tool2_subset_sum_algorithm():
    items = [
        {"id": 1, "amount": 200000, "label": "Tx 1"},
        {"id": 2, "amount": 300000, "label": "Tx 2"},
        {"id": 3, "amount": 500000, "label": "Tx 3"},
        {"id": 4, "amount": 150000, "label": "Tx 4"},
    ]
    target = 1000000.0
    res = solve_subset_sum(target, items)
    
    assert res["found_exact"] is True
    assert res["match_count"] >= 1
    # 200k + 300k + 500k = 1000k
    first_match = res["exact_matches"][0]
    assert first_match["total_amount"] == 1000000.0
    assert first_match["item_count"] == 3


def test_tool2_matcher_api(auth_headers):
    payload = {
        "target_amount": 700000,
        "items": [
            {"id": "A", "amount": 300000, "label": "Item A"},
            {"id": "B", "amount": 400000, "label": "Item B"},
            {"id": "C", "amount": 250000, "label": "Item C"}
        ]
    }
    res = client.post("/api/tools/matcher/solve", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["found_exact"] is True
    assert len(data["exact_matches"]) == 1
    assert data["exact_matches"][0]["total_amount"] == 700000.0


# ============================================================================
# TOOL 3 TESTS (RECAP & DUAL-SHEET EXCEL)
# ============================================================================

def test_tool3_log_parsing_and_excel():
    sample_log = """
    36  PEMINDAHAN DARI 0012345678
    PEMINDAHAN KE 9876543210  BCA
    21 241015
    1.500.000,00-
    
    36  PEMINDAHAN DARI 0012345678
    PEMINDAHAN KE 9876543210  BCA
    21 241015
    1.500.000,00-

    36  PEMINDAHAN DARI 0012345678
    PEMINDAHAN KE 1122334455  MANDIRI
    01 241016
    750.000,00
    """
    parsed = parse_recap_log(sample_log)
    assert parsed["total_transactions"] == 3
    assert "9876543210" in parsed["unique_accounts"]
    assert "1122334455" in parsed["unique_accounts"]
    assert 2024 in parsed["years_detected"]

    # Verify identical transactions exist and are preserved
    same_date_txs = [t for t in parsed["transactions"] if t["iso_date"] == "2024-10-15" and t["account_number"] == "9876543210"]
    assert len(same_date_txs) == 2

    # Generate Excel
    mapping = {"9876543210": "Ahmad Subarjo", "1122334455": "Dewi Sartika"}
    excel_bytes = generate_dual_sheet_excel(parsed, mapping, [2024, 2025])
    assert len(excel_bytes) > 1000

    # Load generated workbook with openpyxl to verify sheets & structure
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes))
    assert "Rekap Transaksi" in wb.sheetnames
    assert "Rekapan Bulanan" in wb.sheetnames
