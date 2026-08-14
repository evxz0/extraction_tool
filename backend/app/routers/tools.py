import io
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.auth.deps import get_current_user
from app.tools.extractor import process_extractor_file, export_extractor_results_to_excel
from app.tools.matcher import solve_subset_sum
from app.tools.recap import parse_recap_log, generate_dual_sheet_excel

router = APIRouter(prefix="/tools", tags=["Extraction & Matching Tools"])


# ============================================================================
# TOOL 1: MULTI-FORMAT SPECIFIC DATA EXTRACTOR
# ============================================================================

@router.post("/extractor/extract")
async def extract_data(
    file: UploadFile = File(...),
    target_user_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        content = await file.read()
        results = process_extractor_file(content, file.filename or "file.txt", target_user_id)
        return {
            "filename": file.filename,
            "target_user_id": target_user_id,
            "total_extracted": len(results),
            "data": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses file ekstraksi: {str(e)}"
        )


@router.post("/extractor/export")
async def export_extracted_excel(
    file: UploadFile = File(...),
    target_user_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        content = await file.read()
        results = process_extractor_file(content, file.filename or "file.txt", target_user_id)
        excel_bytes = export_extractor_results_to_excel(results)
        
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=extracted_data_{file.filename}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal mengekspor file Excel: {str(e)}"
        )


# ============================================================================
# TOOL 2: SIMSEM ACCOUNT MATCHER (SUBSET SUM)
# ============================================================================

class MatcherItem(BaseModel):
    id: Optional[Any] = None
    amount: float
    label: Optional[str] = ""


class MatcherRequest(BaseModel):
    target_amount: float
    items: List[MatcherItem]
    max_combinations: Optional[int] = 10


@router.post("/matcher/solve")
async def solve_matcher(
    req: MatcherRequest,
    current_user: dict = Depends(get_current_user)
):
    if req.target_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target nominal harus lebih besar dari 0.")

    if not req.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Daftar item pecahan tidak boleh kosong.")

    items_payload = [itm.model_dump() for itm in req.items]
    result = solve_subset_sum(
        target_amount=req.target_amount,
        items=items_payload,
        max_combinations=req.max_combinations or 10
    )
    return result


@router.post("/matcher/parse-file")
async def parse_matcher_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload TXT or CSV file containing raw list of fractional amounts."""
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        lines = text.splitlines()
        
        parsed_items = []
        import re
        from app.tools.extractor import parse_amount
        
        for idx, line in enumerate(lines, 1):
            clean = line.strip()
            if not clean:
                continue
            # Try splitting by comma, tab, or semicolon
            parts = [p.strip() for p in re.split(r'[,;\t|]', clean) if p.strip()]
            if len(parts) >= 2:
                # heuristic: one is label, one is amount
                amt1 = parse_amount(parts[0])
                amt2 = parse_amount(parts[1])
                if amt1 > 0 and amt2 == 0:
                    parsed_items.append({"id": idx, "label": parts[1], "amount": amt1})
                elif amt2 > 0:
                    parsed_items.append({"id": idx, "label": parts[0], "amount": amt2})
                else:
                    parsed_items.append({"id": idx, "label": f"Tx #{idx}", "amount": amt1})
            else:
                amt = parse_amount(clean)
                if amt > 0:
                    parsed_items.append({"id": idx, "label": f"Tx #{idx}", "amount": amt})

        return {"total_parsed": len(parsed_items), "items": parsed_items}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Gagal membaca file: {str(e)}")


# ============================================================================
# TOOL 3: OVERTIME EXPENSE MATRIX & MULTI-YEAR RECAP
# ============================================================================

@router.post("/recap/parse")
async def parse_recap(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        parsed = parse_recap_log(text)
        return parsed
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal mem-parsing log lembur: {str(e)}"
        )


@router.post("/recap/generate-excel")
async def generate_recap_excel(
    file: UploadFile = File(...),
    mapping_json: str = Form(...),  # JSON string e.g. {"123456": "Budi", "987654": "Siti"}
    years_json: Optional[str] = Form(None), # JSON string e.g. [2024, 2025, 2026]
    current_user: dict = Depends(get_current_user)
):
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        parsed = parse_recap_log(text)

        account_name_mapping = json.loads(mapping_json) if mapping_json else {}
        target_years = json.loads(years_json) if years_json else None

        excel_bytes = generate_dual_sheet_excel(
            parsed_data=parsed,
            account_name_mapping=account_name_mapping,
            target_years=target_years
        )

        filename = f"Rekap_Lembur_{file.filename.split('.')[0]}.xlsx"
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal menghasilkan file Excel: {str(e)}"
        )
