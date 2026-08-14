import io
import re
from typing import List, Dict, Any, Optional
import pandas as pd


def parse_amount(val: Any) -> float:
    """Parse numeric amount from various string representations."""
    if val is None or pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    
    val_str = str(val).strip()
    # Remove Rp, IDR, commas/dots formatting
    clean_str = re.sub(r'[^\d,.-]', '', val_str)
    # Check Indonesian format: 1.000.000,00 or 1000.00
    if ',' in clean_str and '.' in clean_str:
        if clean_str.rfind(',') > clean_str.rfind('.'):
            # 1.000,50 -> 1000.50
            clean_str = clean_str.replace('.', '').replace(',', '.')
        else:
            # 1,000.50 -> 1000.50
            clean_str = clean_str.replace(',', '')
    elif ',' in clean_str:
        # e.g., 1000,50 -> 1000.50 or 1,000 -> 1000
        parts = clean_str.split(',')
        if len(parts) == 2 and len(parts[1]) == 2:
            clean_str = f"{parts[0]}.{parts[1]}"
        else:
            clean_str = clean_str.replace(',', '')
    
    try:
        return float(clean_str)
    except ValueError:
        return 0.0


def extract_from_dataframe(df: pd.DataFrame, target_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Extract records from structured dataframe with smart column mapping."""
    results = []
    df.columns = [str(c).strip() for c in df.columns]
    col_lower = {c: c.lower() for c in df.columns}

    # Find relevant columns
    time_col = None
    amount_col = None
    outlet_col = None
    user_col = None

    for orig, low in col_lower.items():
        if any(k in low for k in ["time", "jam", "waktu", "timestamp", "date_time", "tanggal"]):
            if not time_col:
                time_col = orig
        if any(k in low for k in ["amount", "nominal", "jumlah", "total", "nilai", "transaksi", "debet", "kredit"]):
            if not amount_col:
                amount_col = orig
        if any(k in low for k in ["outlet", "merchant", "toko", "nama_outlet", "store", "cabang", "keterangan", "deskripsi"]):
            if not outlet_col:
                outlet_col = orig
        if any(k in low for k in ["user_id", "userid", "user", "id_user", "id_outlet", "kode_user", "identifier", "account"]):
            if not user_col:
                user_col = orig

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        user_val = str(row_dict.get(user_col, "")).strip() if user_col else ""
        
        # Check target filter if specified
        if target_user_id:
            target_str = target_user_id.strip().lower()
            # If user_col exists, match it; otherwise search in any column
            if user_col:
                if target_str not in user_val.lower():
                    continue
            else:
                row_text = " ".join([str(v) for v in row_dict.values()]).lower()
                if target_str not in row_text:
                    continue

        time_val = str(row_dict.get(time_col, "")).strip() if time_col else ""
        amount_val = parse_amount(row_dict.get(amount_col, 0)) if amount_col else 0.0
        outlet_val = str(row_dict.get(outlet_col, "")).strip() if outlet_col else ""

        if not outlet_val and user_val:
            outlet_val = f"Merchant/User ({user_val})"

        results.append({
            "row_index": idx + 1,
            "user_id": user_val if user_val else (target_user_id or "N/A"),
            "transaction_time": time_val if time_val and time_val != "nan" else "N/A",
            "amount": amount_val,
            "outlet_name": outlet_val if outlet_val and outlet_val != "nan" else "N/A",
            "raw_data": {str(k): ("" if pd.isna(v) else str(v)) for k, v in row_dict.items()}
        })

    return results


def extract_from_text(content: str, target_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Extract records from unstructured raw text lines."""
    results = []
    lines = content.splitlines()

    # Time regex: HH:MM:SS or HH:MM or ISO timestamp
    time_pattern = re.compile(r'(\b\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?\b|\b\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}(?::\d{2})?\b|\b\d{2}:\d{2}(?::\d{2})?\b)')
    
    # Amount regex: Rp 100.000,00 or 100,000.00 or numeric
    amount_pattern = re.compile(r'(?:Rp\.?\s*|IDR\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\b\d{4,}\b)')
    
    # Outlet regex
    outlet_pattern = re.compile(r'(?:OUTLET|MERCHANT|TOKO|STORE|CABANG|LOKASI)[:\s]+([A-Za-z0-9\s._-]+?)(?=[,\t|;\n]|$)', re.IGNORECASE)

    for idx, line in enumerate(lines, start=1):
        line_clean = line.strip()
        if not line_clean:
            continue

        # Filter target user id if provided
        if target_user_id:
            if target_user_id.lower() not in line_clean.lower():
                continue

        # Extract Time
        time_match = time_pattern.search(line_clean)
        transaction_time = time_match.group(1) if time_match else "N/A"

        # Extract Amount
        amount_matches = amount_pattern.findall(line_clean)
        amount = 0.0
        if amount_matches:
            # Pick the most likely nominal match (usually the longest or last)
            valid_amounts = [parse_amount(m) for m in amount_matches if parse_amount(m) > 0]
            if valid_amounts:
                amount = valid_amounts[-1]

        # Extract Outlet
        outlet_match = outlet_pattern.search(line_clean)
        if outlet_match:
            outlet_name = outlet_match.group(1).strip()
        else:
            # Fallback heuristic: check parts separated by pipe, semicolon, or tab
            parts = [p.strip() for p in re.split(r'[,|\t;]', line_clean) if p.strip()]
            outlet_name = parts[1] if len(parts) > 1 else (parts[0] if parts else "N/A")

        user_id_val = target_user_id if target_user_id else "N/A"
        # Check if user ID is explicitly specified like USER: 12345
        user_match = re.search(r'(?:USER\s*ID|USER|ID)[:\s]+([A-Za-z0-9_-]+)', line_clean, re.IGNORECASE)
        if user_match:
            user_id_val = user_match.group(1)

        results.append({
            "row_index": idx,
            "user_id": user_id_val,
            "transaction_time": transaction_time,
            "amount": amount,
            "outlet_name": outlet_name,
            "raw_data": {"raw_line": line_clean}
        })

    return results


def process_extractor_file(file_bytes: bytes, filename: str, target_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Process uploaded file based on format (.csv, .xlsx, .txt)."""
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".csv"):
        try:
            # Try utf-8 first, fallback to latin-1
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
        return extract_from_dataframe(df, target_user_id)
        
    elif filename_lower.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_bytes))
        return extract_from_dataframe(df, target_user_id)
        
    else:  # Treat as text (.txt, logs, etc.)
        try:
            content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = file_bytes.decode("latin-1")
        return extract_from_text(content, target_user_id)


def export_extractor_results_to_excel(results: List[Dict[str, Any]]) -> bytes:
    """Export extracted records to styled Excel format."""
    df_data = []
    for r in results:
        df_data.append({
            "No": r.get("row_index"),
            "User ID": r.get("user_id"),
            "Waktu Transaksi": r.get("transaction_time"),
            "Nominal (Rp)": r.get("amount"),
            "Nama Outlet / Merchant": r.get("outlet_name"),
        })
    df = pd.DataFrame(df_data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Data Ekstraksi")
        
        # Style header
        worksheet = writer.sheets["Data Ekstraksi"]
        for col_num, col_name in enumerate(df.columns, 1):
            cell = worksheet.cell(row=1, column=col_num)
            cell.style = "Headline 3"
            
    output.seek(0)
    return output.getvalue()
