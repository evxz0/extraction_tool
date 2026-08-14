Role: Senior Full-Stack Engineer & Software Architect
Objective: Build a high-performance web application focused on data extraction, parsing, and algorithmic matching with a clean Tools-Hub UI.

---

### 1. TECH STACK & INFRASTRUCTURE
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons (Single Page Application, deployed on Vercel).
- **Backend:** FastAPI (Python 3.11+) (Deployed on Render).
- **Primary Database:** Supabase (PostgreSQL) — for credentials & persistent records.
- **Cache / Session Engine:** Upstash (Redis) — for strict "1 User 1 Device" active session locking.

---

### 2. CORE SYSTEM & AUTHENTICATION SPECIFICATIONS
1. **Minimalist Architecture:**
   - Features: Login, Reset Password, and a centralized Tools Hub Dashboard (No complex nested pages).
2. **1 User 1 Device Concurrent Login Prevention:**
   - On Login:
     1. Verify credentials via PostgreSQL (bcrypt hashing).
     2. Check Redis key `session:user:{user_id}`.
     3. If key exists -> Reject login with error: "Akun Anda sedang aktif di perangkat lain."
     4. If key does NOT exist -> Generate session token/JWT, store in Redis `session:user:{user_id}` with 8-hour TTL, and return token to client.
   - On API Requests:
     - FastAPI Middleware/Dependency validates that incoming bearer token matches the active session token in Redis.
   - On Logout:
     - Delete `session:user:{user_id}` in Redis immediately to release device lock.

---

### 3. TOOLS SPECIFICATIONS (TOOLS HUB)

#### **Tool 1: Multi-Format Specific Data Extractor**
- **Input:** Accepts `.txt`, `.csv`, or `.xlsx` files + a target User ID / Identifier.
- **Logic:**
  - Reads raw unstructured/structured text.
  - Uses Regex / Pandas to extract:
    1. Transaction Time (HH:MM:SS / Timestamp).
    2. Transaction Amount (Nominal).
    3. Outlet / Merchant Name based on the specified User ID.
- **Output:** Clean JSON displayed as an interactive table with an option to Export to CSV/Excel.

#### **Tool 2: Simsem Account Matcher (Subset Sum Algorithm)**
- **Input:** Target withdrawal amount (e.g., Rp 1.000.000) and a list/file of return/fractional transactions (e.g., [200k, 300k, 500k, 150k]).
- **Logic:**
  - Solves the Subset Sum Problem using backtracking/dynamic programming in Python.
  - Identifies which combination of fractional transactions precisely sums up to the target amount.
- **Output:** Highlighted match pairs/groups showing exact breakdown totals.

#### **Tool 3: Overtime Expense Matrix & Multi-Year Recap Generator**
- **Input:** Raw log file `.txt` containing block patterns:
  - Block split: `r'(?:\r?\n)(?=36\s+)'` or `r'(?=\b36\s+.*\bPEMINDAHAN\b)'`.
  - Account Regex: `r'PEMINDAHAN\s+KE\s+(\d+)'`.
  - Date Regex: `r'(?:21|01)\s+(\d{2})(\d{2})(\d{2})'`.
  - Amount Regex: `r'(\d{1,3}(?:\.\d{3})*,\d{2}-?)'`.
- **Constraint:**
  - If identical transactions (same date, same account, same amount) occur, **DO NOT sum them up**; display them on separate sub-rows within that date.
- **Workflow:**
  1. *Step 1:* Upload `.txt` -> API parses and returns unique account numbers.
  2. *Step 2:* Frontend shows an inline form for the user to map `Account Number -> Employee Name`.
  3. *Step 3:* Generate a dual-sheet Excel `.xlsx` file (processed in-memory via `openpyxl` & `io.BytesIO`):
     - **Sheet 1 ("Rekap Transaksi"):** Daily Transaction Matrix (Dates as rows, Name & Account No. as multi-headers).
     - **Sheet 2 ("Rekapan Bulanan"):** Multi-Year Recap (2024, 2025, 2026) showing Jan–Dec breakdown per person + horizontal & vertical `=SUM()` formulas and formatted borders.

---

### 4. UI / UX DESIGN REQUIREMENTS
- Clean, modern grid/card design (inspired by Tools Hub / Integration Directories).
- Header with minimalist Brand Title and a Logout button.
- Main area: 3 interactive cards (Tool 1, Tool 2, Tool 3) with icons, clear titles, and descriptions.
- Clicking a card opens an in-place Workspace Modal / Drawer (No full page reloads).
- File upload dropzones supporting `.txt`, `.csv`, `.xlsx`.

---

### 5. YOUR TASK
Please generate the complete codebase and project setup step-by-step:
1. **Backend Project Setup (FastAPI):**
   - Folder structure, `requirements.txt`, and database connection configs (`supabase-py` / `asyncpg` + `upstash-redis` / `redis-py`).
   - Auth routes (Login with 1-device lock, Reset Password, Logout) + Auth Middleware.
   - API endpoints for Tool 1, Tool 2, and Tool 3 (using in-memory file processing and streaming).
2. **Frontend Project Setup (React + Vite + Tailwind):**
   - Main dashboard component (`ToolsHub.jsx`) with grid cards.
   - Modal components for each tool, handling file upload, dynamic form mapping (for Tool 3), and file download.
   - Auth state management (storing token, auto-redirect to login on 401).