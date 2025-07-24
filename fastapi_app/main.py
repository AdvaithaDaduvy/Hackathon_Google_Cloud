from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import time
import requests
import json
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# Add logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:8501",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8501",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_BASE_URL = "http://localhost:8000"
APP_NAME = "multitoolagent"

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

SESSIONS = {}

class MessageRequest(BaseModel):
    message: str

# Helper function to create session payload
def create_session_payload():
    """Create the complex session payload required by the SDK server"""
    return {
        "state": {},
        "events": []
    }

# Your existing endpoints...
@app.get("/")
def home(request: Request):
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    session_id = SESSIONS.get(user_id, {}).get("session_id")
    messages = SESSIONS.get(user_id, {}).get("messages", [])
    return templates.TemplateResponse("index.html", {
        "request": request,
        "session_id": session_id,
        "messages": messages,
        "user_id": user_id
    })

@app.post("/create_session")
def create_session(request: Request):
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    
    logger.info(f"Creating session for user {user_id}")
    
    try:
        # Use the correct session creation endpoint and payload
        url = f"{API_BASE_URL}/apps/{APP_NAME}/users/{user_id}/sessions"
        payload = create_session_payload()
        
        logger.info(f"Making session creation request to: {url}")
        logger.info(f"Payload: {json.dumps(payload, indent=2)}")
        
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=10
        )
        
        logger.info(f"SDK server response status: {res.status_code}")
        logger.info(f"SDK server response: {res.text}")
        
        if res.status_code == 200:
            response_data = res.json()
            session_id = response_data.get("id")  # The session ID is in the "id" field
            
            if session_id:
                SESSIONS[user_id] = {
                    "session_id": session_id,
                    "messages": []
                }
                logger.info(f"Session created successfully: {session_id}")
            else:
                logger.error("No session ID returned from SDK server")
        else:
            logger.error(f"Failed to create session: {res.status_code} - {res.text}")
    except Exception as e:
        logger.error(f"Error creating session: {e}")
    
    response = RedirectResponse("/", status_code=302)
    response.set_cookie("user_id", user_id)
    return response

@app.post("/send_message")
def send_message(request: Request, message: str = Form(...)):
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    if not session:
        return RedirectResponse("/", status_code=302)
    
    session_id = session["session_id"]
    session["messages"].append({"role": "user", "content": message})
    
    logger.info(f"Sending message to SDK server: {message}")
    
    try:
        payload = {
            "appName": APP_NAME,
            "userId": user_id,
            "sessionId": session_id,
            "newMessage": {
                "parts": [
                    {
                        "text": message
                    }
                ],
                "role": "user"
            },
            "streaming": False,
            "stateDelta": {}
        }
        
        res = requests.post(
            f"{API_BASE_URL}/run",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=30
        )
        
        logger.info(f"SDK server response status: {res.status_code}")
        logger.info(f"SDK server response: {res.text[:500]}")
        
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
                logger.info(f"Assistant response: {assistant_message[:100]}")
    except Exception as e:
        logger.error(f"Error sending message to SDK: {e}")
    
    return RedirectResponse("/", status_code=302)

# JSON API ENDPOINTS
@app.get("/api/session")
def get_session_api(request: Request):
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    session = SESSIONS.get(user_id, {})
    
    response_data = {
        "user_id": user_id,
        "session_id": session.get("session_id"),
        "messages": session.get("messages", [])
    }
    
    response = JSONResponse(response_data)
    if user_id not in SESSIONS:
        response.set_cookie("user_id", user_id)
    
    return response

@app.post("/api/create_session")
def create_session_api(request: Request):
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    
    logger.info(f"API: Creating session for user {user_id}")
    
    try:
        # Use the correct session creation endpoint and payload
        url = f"{API_BASE_URL}/apps/{APP_NAME}/users/{user_id}/sessions"
        payload = create_session_payload()
        
        logger.info(f"Making session creation request to: {url}")
        logger.info(f"Payload: {json.dumps(payload, indent=2)}")
        
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=10
        )
        
        logger.info(f"SDK server response status: {res.status_code}")
        logger.info(f"SDK server response text: {res.text}")
        
        if res.status_code == 200:
            response_data = res.json()
            session_id = response_data.get("id")  # The session ID is in the "id" field
            
            if session_id:
                SESSIONS[user_id] = {
                    "session_id": session_id,
                    "messages": []
                }
                
                return JSONResponse({
                    "success": True,
                    "user_id": user_id,
                    "session_id": session_id,
                    "messages": [],
                    "sdk_response": response_data
                })
            else:
                return JSONResponse({
                    "success": False,
                    "error": "No session ID returned from SDK server",
                    "sdk_response": response_data
                })
        else:
            return JSONResponse({
                "success": False,
                "error": f"Failed to create session: {res.status_code} - {res.text}",
                "status_code": res.status_code
            })
    except Exception as e:
        logger.error(f"Exception creating session: {e}")
        return JSONResponse({
            "success": False,
            "error": f"Error creating session: {str(e)}"
        })

@app.post("/api/send_message")
def send_message_api(request: Request, message_data: MessageRequest):
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    logger.info(f"API: Received message from user {user_id}: {message_data.message}")
    
    if not session:
        logger.warning(f"No session found for user {user_id}")
        # Try to create a session automatically
        try:
            url = f"{API_BASE_URL}/apps/{APP_NAME}/users/{user_id}/sessions"
            payload = create_session_payload()
            
            res = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=10
            )
            
            if res.status_code == 200:
                response_data = res.json()
                session_id = response_data.get("id")
                
                if session_id:
                    SESSIONS[user_id] = {
                        "session_id": session_id,
                        "messages": []
                    }
                    session = SESSIONS[user_id]
                    logger.info(f"Auto-created session: {session_id}")
                else:
                    return JSONResponse({
                        "success": False,
                        "error": "Failed to auto-create session"
                    })
            else:
                return JSONResponse({
                    "success": False,
                    "error": "No active session and failed to create one"
                })
        except Exception as e:
            return JSONResponse({
                "success": False,
                "error": f"No active session and error creating one: {str(e)}"
            })
    
    session_id = session["session_id"]
    message = message_data.message
    
    # Add user message to session
    session["messages"].append({"role": "user", "content": message})
    
    try:
        # Send message to SDK server with correct format
        url = f"{API_BASE_URL}/run"
        payload = {
            "appName": APP_NAME,
            "userId": user_id,
            "sessionId": session_id,
            "newMessage": {
                "parts": [
                    {
                        "text": message
                    }
                ],
                "role": "user"
            },
            "streaming": False,
            "stateDelta": {}
        }
        
        logger.info(f"Making request to SDK server: {url}")
        logger.info(f"Payload: {json.dumps(payload, indent=2)}")
        
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=30
        )
        
        logger.info(f"SDK server response status: {res.status_code}")
        logger.info(f"SDK server response headers: {dict(res.headers)}")
        logger.info(f"SDK server response text: {res.text[:1000]}")
        
        if res.status_code == 200:
            try:
                events = res.json()
                assistant_message = None
                audio_path = None
                
                logger.info(f"Processing response from SDK server")
                logger.info(f"Response type: {type(events)}")
                logger.info(f"Response content: {json.dumps(events, indent=2)[:1000]}")
                
                # Handle different response formats
                if isinstance(events, list):
                    # If it's a list of events
                    for i, event in enumerate(events):
                        logger.info(f"Event {i}: {json.dumps(event, indent=2)[:500]}")
                        content = event.get("content", {})
                        parts = content.get("parts", [{}])
                        
                        if content.get("role") == "model" and len(parts) > 0 and "text" in parts[0]:
                            assistant_message = parts[0]["text"]
                            logger.info(f"Found assistant message: {assistant_message[:100]}")
                        
                        if len(parts) > 0 and "functionResponse" in parts[0]:
                            func_resp = parts[0]["functionResponse"]
                            if func_resp.get("name") == "text_to_speech":
                                response_text = func_resp.get("response", {}).get("result", {}).get("content", [{}])[0].get("text", "")
                                if "File saved as:" in response_text:
                                    file_name = response_text.split("File saved as:")[1].strip().split()[0].strip(".")
                                    audio_path = f"/static/{file_name}" if os.path.exists(f"static/{file_name}") else None
                elif isinstance(events, dict):
                    # If it's a single response object
                    logger.info(f"Single response: {json.dumps(events, indent=2)[:500]}")
                    
                    # Check if there's a direct message
                    if "message" in events:
                        assistant_message = events["message"]
                    elif "content" in events:
                        content = events["content"]
                        if isinstance(content, str):
                            assistant_message = content
                        elif isinstance(content, dict) and "text" in content:
                            assistant_message = content["text"]
                    elif "response" in events:
                        assistant_message = events["response"]
                    elif "events" in events and len(events["events"]) > 0:
                        # Check if there are events in the response
                        for event in events["events"]:
                            content = event.get("content", {})
                            parts = content.get("parts", [{}])
                            if content.get("role") == "model" and len(parts) > 0 and "text" in parts[0]:
                                assistant_message = parts[0]["text"]
                                break
                
                # If we still don't have a message, try to extract from any text field
                if not assistant_message:
                    assistant_message = f"Received response from agent: {str(events)[:200]}..."
                
                if assistant_message:
                    session["messages"].append({
                        "role": "assistant",
                        "content": assistant_message,
                        "audio_path": audio_path
                    })
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": assistant_message,
                    "audio_path": audio_path,
                    "raw_response": events  # Include raw response for debugging
                })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                # Treat as plain text response
                assistant_message = res.text
                session["messages"].append({
                    "role": "assistant",
                    "content": assistant_message,
                    "audio_path": None
                })
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": assistant_message,
                    "audio_path": None
                })
        else:
            logger.error(f"SDK server returned error: {res.status_code} - {res.text}")
            return JSONResponse({
                "success": False,
                "error": f"Agent server error: {res.status_code} - {res.text}",
                "messages": session["messages"]
            })
            
    except requests.exceptions.Timeout:
        logger.error("Timeout connecting to SDK server")
        return JSONResponse({
            "success": False,
            "error": "Timeout connecting to agent server",
            "messages": session["messages"]
        })
    except requests.exceptions.ConnectionError:
        logger.error("Connection error to SDK server")
        return JSONResponse({
            "success": False,
            "error": "Cannot connect to agent server. Is it running on port 8000?",
            "messages": session["messages"]
        })
    except Exception as e:
        logger.error(f"Exception sending message to SDK: {e}")
        return JSONResponse({
            "success": False,
            "error": f"Error communicating with agent: {str(e)}",
            "messages": session["messages"]
        })

@app.get("/api/health")
def health_check():
    try:
        res = requests.get(f"{API_BASE_URL}/health", timeout=5)
        agent_status = "connected" if res.status_code == 200 else "error"
        agent_response = res.text if res.status_code == 200 else f"Error: {res.status_code}"
    except Exception as e:
        agent_status = "disconnected"
        agent_response = str(e)
    
    return {
        "status": "running",
        "agent_server": agent_status,
        "agent_url": API_BASE_URL,
        "app_name": APP_NAME,
        "agent_response": agent_response
    }

# Test endpoint to create a session manually
@app.post("/api/test_create_session")
def test_create_session():
    """Test endpoint to create a session with the correct format"""
    test_user_id = f"test_user_{int(time.time())}"
    
    try:
        url = f"{API_BASE_URL}/apps/{APP_NAME}/users/{test_user_id}/sessions"
        payload = create_session_payload()
        
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=10
        )
        
        return {
            "status_code": res.status_code,
            "response": res.json() if res.status_code == 200 else res.text,
            "payload_sent": payload,
            "url": url
        }
    except Exception as e:
        return {
            "error": str(e),
            "payload_sent": payload,
            "url": url
        }
