---
description: How to start the OBD Agent locally (Frontend + Backend)
---

Follow these steps to run the application entirely on your local machine:

### 1. Start the Backend (FastAPI)
Open a new terminal and run:
```bash
cd backend
# Activate virtual environment if you have one, e.g.:
# source venv/bin/activate
python main.py
```
*The backend is live when you see: `INFO: Uvicorn running on http://0.0.0.0:8000`*

### 2. Start the Frontend (Next.js)
Open a second terminal and run:
```bash
cd frontend
npm run dev
```
*The frontend is live when you see: `ready - started server on 0.0.0.0:3000`*

### 3. Verification
- Open your browser to [http://localhost:3000](http://localhost:3000)
- The header should show **"Backend: Connected"** with a green icon.
