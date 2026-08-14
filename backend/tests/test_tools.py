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
import openpyxl

client = TestClient(app)


@pytest.fixture
def auth_headers():
    session_redis.flush_all()
    admin_user = db_manager.get_user_by_email_or_username("admin")
    if not admin_user:
        db_manager.create_user(
            user_id="usr_admin_001",
            email="admin@extractiontools.com",
            username="admin",
            hashed_password=hash_password("admin123"),
            full_name="Administrator"
        )
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
    # User's exact banking log patterns from screenshot
    sample_log = """
36      127256 PEMINDAHAN KE 758547291
20      127256 0000000000 00 LEMBUR SATPAM JUMAT TGL 23/02/2024
01 260224 0023 13 84061 021051 260224 127256 00  00  00
   00000000                              90.627,00-  2.036.338.523,00

36      121091 PEMINDAHAN KE 1050319826
20      121091 0000000000 00 LEMBUR SATPAM JUMAT TGL 23/02/2024
01 260224 0023 13 84061 021051 260224 121091 00  00  00
   00000000                              90.627,00-  2.036.429.150,00

36      9211 PEMINDAHAN KE 219626190
21 050626 0996 09 00001 021051 050626 009211 01   Ext Narration
20      9211 23/818177/LEMBUR DRIVER
01 050626 0996 09 00001 021051 050626 009211 00  00  00
   00000000                              692.070,00-  337.623.657,00-
    """
    parsed = parse_recap_log(sample_log)
    assert parsed["total_transactions"] == 3
    assert "758547291" in parsed["unique_accounts"]
    assert "1050319826" in parsed["unique_accounts"]
    assert "219626190" in parsed["unique_accounts"]

    # Verify dates parsed as DD/MM/YYYY: 26/02/2024 and 05/06/2026
    tx1 = [t for t in parsed["transactions"] if t["account_number"] == "758547291"][0]
    assert tx1["display_date"] == "26/02/2024"
    assert tx1["year"] == 2024
    assert tx1["month"] == 2
    assert tx1["day"] == 26
    assert tx1["amount"] == 90627.0

    tx3 = [t for t in parsed["transactions"] if t["account_number"] == "219626190"][0]
    assert tx3["display_date"] == "05/06/2026"
    assert tx3["year"] == 2026
    assert tx3["month"] == 6
    assert tx3["day"] == 5
    assert tx3["amount"] == 692070.0  # Not 337.623.657!

    # Years detected must be 2024 and 2026 (never 2000!)
    assert 2000 not in parsed["years_detected"]
    assert 2024 in parsed["years_detected"]
    assert 2026 in parsed["years_detected"]

    # Generate Excel and inspect headers
    mapping = {"758547291": "Karyawan 1", "1050319826": "Karyawan 2", "219626190": "Karyawan 3"}
    excel_bytes = generate_dual_sheet_excel(parsed, mapping, [2024, 2025, 2026])
    
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes))
    ws1 = wb["Rekap Transaksi"]
    
    # Check that row 4 contains pure account number without "No. Rek:" prefix
    acc_val = ws1.cell(row=4, column=2).value
    assert acc_val == "1050319826" or acc_val in parsed["unique_accounts"]
    assert "No. Rek:" not in str(acc_val)
