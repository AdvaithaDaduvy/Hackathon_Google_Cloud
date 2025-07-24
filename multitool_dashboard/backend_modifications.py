# Add these imports to your FastAPI backend
from fastapi.middleware.cors import CORSMiddleware
import json

# Add this CORS middleware to your FastAPI app (add after app = FastAPI())
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Optional: Add a JSON API endpoint for better frontend integration
@app.get("/api/session")
def get_session_api(request: Request):
    """Get session data as JSON instead of HTML template"""
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    session = SESSIONS.get(user_id, {})
    
    return {
        "user_id": user_id,
        "session_id": session.get("session_id"),
        "messages": session.get("messages", [])
    }

@app.post("/api/send_message")
def send_message_api(request: Request, message_data: dict):
    """Send message and return JSON response instead of redirect"""
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    if not session:
        return {"error": "No active session"}
    
    session_id = session["session_id"]
    message = message_data.get("message", "")
    
    # Add user message
    session["messages"].append({"role": "user", "content": message})
    
    # Your existing API call logic here...
    res = requests.post(
        f"{API_BASE_URL}/run",
        headers={"Content-Type": "application/json"},
        data=json.dumps({
            "app_name": APP_NAME,
            "user_id": user_id,
            "session_id": session_id,
            "new_message": {
                "role": "user",
                "parts": [{"text": message}]
            }
        })
    )
    
    if res.status_code == 200:
        events = res.json()
        assistant_message = None
        audio_path = None
        
        for event in events:
            content = event.get("content", {})
            parts = content.get("parts", [{}])
            if content.get("role") == "model" and "text" in parts[0]:
                assistant_message = parts[0]["text"]
            if "functionResponse" in parts[0]:
                func_resp = parts[0]["functionResponse"]
                if func_resp.get("name") == "text_to_speech":
                    response_text = func_resp.get("response", {}).get("result", {}).get("content", [{}])[0].get("text", "")
                    if "File saved as:" in response_text:
                        file_name = response_text.split("File saved as:")[1].strip().split()[0].strip(".")
                        audio_path = f"/static/{file_name}" if os.path.exists(f"static/{file_name}") else None
        
        if assistant_message:
            session["messages"].append({
                "role": "assistant",
                "content": assistant_message,
                "audio_path": audio_path
            })
    
    return {
        "success": True,
        "messages": session["messages"]
    }
