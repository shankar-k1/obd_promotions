from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict
from modules.email_module import EmailModule
from modules.scrubbing_engine import ScrubbingEngine
from modules.alerting_system import AlertingSystem
from modules.upload_handler import UploadHandler
from modules.database_module import DatabaseModule
from agents.obd_prompt_agent import OBDPromptAgent
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Outsmart OBD Agent API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root_diagnostic():
    return {
        "message": "Outsmart OBD API is Live (FastAPI)",
        "db_configured": os.getenv("DATABASE_URL") is not None,
        "db_type": os.getenv("DB_TYPE", "postgresql")
    }

email_module = EmailModule()
scrubbing_engine = ScrubbingEngine()
alerting_system = AlertingSystem()
upload_handler = UploadHandler()
prompt_agent = OBDPromptAgent()
db = DatabaseModule()

class FlowRequest(BaseModel):
    email_context: str

class ScheduleRequest(BaseModel):
    obd_name: str
    flow_name: str
    msc_ip: str
    cli: str

class ProcessRequest(BaseModel):
    msisdn_list: Optional[List[str]] = []
    operator: Optional[str] = None
    email_context: Optional[str] = None
    options: Optional[Dict[str, bool]] = None

@app.get("/")
async def root():
    return {"message": "Welcome to Outsmart OBD Agent API"}

@app.get("/fetch-request")
async def fetch_request():
    """Fetches the latest OBD request from email."""
    try:
        request = email_module.fetch_latest_obd_request()
        if request:
            details = email_module.extract_obd_details(request["body"])
            return {"email": request, "extracted_details": details}
        return {"message": "No new requests found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrub")
async def scrub_base(request: ProcessRequest):
    """Performs scrubbing on the provided MSISDN list with specific options."""
    try:
        final_base, report = scrubbing_engine.perform_full_scrub(
            request.msisdn_list, 
            request.operator, 
            request.options
        )
        
        # Push results to email
        try:
            email_module.send_scrub_report(report)
        except Exception as e:
            print(f"WARNING: Email report failed to send: {e}")

        print(f"DEBUG: Scrub complete. Final base count: {len(final_base)}")
        return {"final_base_count": len(final_base), "final_base": final_base, "report": report}
    except Exception as e:
        print(f"DEBUG: Scrub error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handles MSISDN file uploads."""
    try:
        content = await file.read()
        extension = os.path.splitext(file.filename)[1]
        msisdns = upload_handler.process_file(content, extension)
        res_data = {"count": len(msisdns), "msisdns": msisdns, "total": len(msisdns)}
        print(f"DEBUG: Returning response with total: {res_data['total']}")
        return res_data
    except Exception as e:
        print(f"DEBUG: Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-flow-from-doc")
async def flow_from_doc(doc_text: str = Form(...)):
    """Generates a flow diagram from document text."""
    try:
        flow = prompt_agent.generate_flow_from_doc(doc_text)
        return {"flow": flow}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-content")
async def generate_content(request: ProcessRequest):
    """Generates OBD prompts and flow diagram."""
    context = request.email_context or "Standard promotional campaign"
    prompts = prompt_agent.generate_prompts(context)
    flow = prompt_agent.generate_flow_mermaid(context)
    return {"prompts": prompts, "flow": flow}

@app.get("/db-stats")
async def get_db_stats():
    """Returns counts for DnD list, subscriptions, and unsubscriptions."""
    if not db.engine:
        return {"dnd_count": "DB_NOT_INIT", "sub_count": "DB_NOT_INIT", "unsub_count": "DB_NOT_INIT"}
        
    try:
        # Check connection explicitly
        with db.engine.connect() as conn:
            dnd_res = conn.execute(text("SELECT COUNT(*) AS cnt FROM dnd_list")).mappings().first()
            sub_res = conn.execute(text("SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'ACTIVE'")).mappings().first()
            unsub_res = conn.execute(text("SELECT COUNT(*) AS cnt FROM unsubscriptions")).mappings().first()
            
            return {
                "dnd_count": dnd_res['cnt'] if dnd_res else 0,
                "sub_count": sub_res['cnt'] if sub_res else 0,
                "unsub_count": unsub_res['cnt'] if unsub_res else 0,
            }
    except Exception as e:
        print(f"DB Stats Error: {e}")
        return {"dnd_count": f"ERR: {str(e)[:20]}...", "sub_count": "ERR", "unsub_count": "ERR"}

@app.post("/schedule-promotion")
async def schedule_promotion(request: ScheduleRequest):
    """Saves scheduling details for a promotion."""
    success = db.save_scheduling_details(request.dict())
    if success:
        return {"status": "success", "message": "Promotion scheduled successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save scheduling details")

@app.get("/health-check")
async def health_check():
    """Monitors the current promotion health and database connectivity."""
    db_status = "Disconnected"
    db_host = "N/A"
    try:
        if db.engine:
            with db.engine.connect() as conn:
                db_status = "Connected"
                # Extract host safely for diagnostic display
                db_host = str(db.engine.url.host) if db.engine.url else "unknown"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    mock_stats = {"success_rate": 0.45, "unsub_rate": 0.01}
    alerts = alerting_system.check_promotion_health(mock_stats)
    return {
        "status": "Monitoring", 
        "database": db_status,
        "connected_to": db_host,
        "database_type": db.db_type,
        "alerts": alerts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
