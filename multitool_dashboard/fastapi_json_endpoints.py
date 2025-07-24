# Add these endpoints to your existing FastAPI file for better integration

@app.get("/api/session")
def get_session_api(request: Request):
    """Get current session data as JSON"""
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    session = SESSIONS.get(user_id, {})
    
    response_data = {
        "user_id": user_id,
        "session_id": session.get("session_id"),
        "messages": session.get("messages", [])
    }
    
    # Set cookie if new user
    response = JSONResponse(response_data)
    if user_id not in SESSIONS:
        response.set_cookie("user_id", user_id)
    
    return response

@app.post("/api/send_message")
def send_message_api(request: Request, data: dict):
    """Send message and return JSON response instead of redirect"""
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    if not session:
        return {"error": "No active session", "success": False}
    
    session_id = session["session_id"]
    message = data.get("message", "")
    
    # Add user message
    session["messages"].append({"role": "user", "content": message})
    
    # Your existing API call logic
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

# Don't forget to import JSONResponse at the top:
# from fastapi.responses import JSONResponse
