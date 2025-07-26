# Add these authentication-related endpoints to your FastAPI backend (main.py)

# Add this to your existing MessageRequest model or create a new one
class AuthRequest(BaseModel):
    message: str
    auth_flow: bool = False
    email: str = ""
    password: str = ""
    action: str = ""  # "signin" or "register"

# Update your send_message_api function to handle authentication
@app.post("/api/send_message")
def send_message_api(request: Request, message_data: AuthRequest):
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    # Handle authentication flow
    if message_data.auth_flow:
        logger.info(f"Authentication request: {message_data.action} for {message_data.email}")
        
        # Create or get user session for authentication
        if not user_id:
            user_id = f"auth_user_{int(time.time())}"
        
        if user_id not in SESSIONS:
            # Create session for authentication
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
                            "messages": [],
                            "preferred_language": "en",
                            "authenticated": False,
                            "user_email": message_data.email
                        }
                        session = SESSIONS[user_id]
                    else:
                        return JSONResponse({
                            "success": False,
                            "error": "Failed to create authentication session"
                        })
                else:
                    return JSONResponse({
                        "success": False,
                        "error": "Failed to connect to authentication service"
                    })
            except Exception as e:
                return JSONResponse({
                    "success": False,
                    "error": f"Authentication service error: {str(e)}"
                })
        else:
            session = SESSIONS[user_id]
    
    logger.info(f"API: Received message from user {user_id}: {message_data.message}")
    
    if not session:
        logger.warning(f"No session found for user {user_id}")
        # Auto-create session logic (keep existing code for non-auth flows)
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
                        "messages": [],
                        "preferred_language": "en"
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
    user_language = get_user_language_preference(user_id)
    
    # Detect input language
    detected_language = detect_language(message)
    logger.info(f"Detected language: {detected_language}, User preference: {user_language}")
    
    # Translate user message to English for AI processing if needed
    translated_for_ai = translate_text(message, 'en', detected_language)
    ai_message = translated_for_ai['translated_text']
    
    # Add user message to session (in original language)
    session["messages"].append({
        "role": "user", 
        "content": message,
        "language": detected_language,
        "translated_content": ai_message if translated_for_ai['translation_needed'] else None
    })
    
    try:
        # Send translated message to SDK server
        url = f"{API_BASE_URL}/run"
        payload = {
            "appName": APP_NAME,
            "userId": user_id,
            "sessionId": session_id,
            "newMessage": {
                "parts": [
                    {
                        "text": ai_message  # Send English version to AI
                    }
                ],
                "role": "user"
            },
            "streaming": False,
            "stateDelta": {}
        }
        
        logger.info(f"Making request to SDK server: {url}")
        
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=30
        )
        
        logger.info(f"SDK server response status: {res.status_code}")
        
        if res.status_code == 200:
            try:
                events = res.json()
                assistant_message = None
                audio_path = None
                
                logger.info(f"Processing response from SDK server")
                
                # Handle different response formats (keep existing logic)
                if isinstance(events, list):
                    for i, event in enumerate(events):
                        content = event.get("content", {})
                        parts = content.get("parts", [{}])
                        
                        if content.get("role") == "model" and len(parts) > 0 and "text" in parts[0]:
                            assistant_message = parts[0]["text"]
                            logger.info(f"Found assistant message: {assistant_message[:100]}")
                        
                        # Keep existing audio path logic for backward compatibility
                        if len(parts) > 0 and "functionResponse" in parts[0]:
                            func_resp = parts[0]["functionResponse"]
                            if func_resp.get("name") == "text_to_speech":
                                response_text = func_resp.get("response", {}).get("result", {}).get("content", [{}])[0].get("text", "")
                                if "File saved as:" in response_text:
                                    file_name = response_text.split("File saved as:")[1].strip().split()[0].strip(".")
                                    audio_path = f"/static/{file_name}" if os.path.exists(f"static/{file_name}") else None
                elif isinstance(events, dict):
                    logger.info(f"Single response: {json.dumps(events, indent=2)[:500]}")
                    
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
                        for event in events["events"]:
                            content = event.get("content", {})
                            parts = content.get("parts", [{}])
                            if content.get("role") == "model" and len(parts) > 0 and "text" in parts[0]:
                                assistant_message = parts[0]["text"]
                                break
                
                if not assistant_message:
                    assistant_message = f"Received response from agent: {str(events)[:200]}..."
                
                # Handle authentication responses
                if message_data.auth_flow:
                    # Check if authentication was successful based on AI response
                    auth_success = False
                    if assistant_message:
                        lower_response = assistant_message.lower()
                        if any(keyword in lower_response for keyword in ["welcome", "success", "authenticated", "logged in", "signed in", "registered"]):
                            auth_success = True
                            session["authenticated"] = True
                            session["user_email"] = message_data.email
                        elif any(keyword in lower_response for keyword in ["failed", "error", "invalid", "incorrect", "denied"]):
                            auth_success = False
                
                # Translate assistant response to user's preferred language
                translated_response = translate_text(assistant_message, user_language, 'en')
                final_response = translated_response['translated_text']
                
                # Generate multilingual GTTS audio for assistant message
                gtts_audio_path = None
                if final_response:
                    logger.info(f"Generating GTTS audio in {user_language} for assistant response...")
                    gtts_audio_path = generate_multilingual_speech_audio(final_response, user_language)
                    if gtts_audio_path:
                        logger.info(f"Multilingual GTTS audio generated: {gtts_audio_path}")
                    else:
                        logger.warning("Failed to generate multilingual GTTS audio")
                
                if assistant_message:
                    session["messages"].append({
                        "role": "assistant",
                        "content": final_response,  # Store translated response
                        "original_content": assistant_message if translated_response['translation_needed'] else None,
                        "language": user_language,
                        "audio_path": audio_path,  # Keep original audio if available
                        "gtts_audio_path": gtts_audio_path  # Add multilingual GTTS audio path
                    })
                
                # Clean up old audio files periodically
                cleanup_old_audio_files()
                
                response_data = {
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": final_response,
                    "original_response": assistant_message if translated_response['translation_needed'] else None,
                    "user_language": user_language,
                    "detected_language": detected_language,
                    "audio_path": audio_path,
                    "gtts_audio_path": gtts_audio_path,
                    "raw_response": events
                }
                
                # Add authentication status for auth flows
                if message_data.auth_flow:
                    response_data["authenticated"] = session.get("authenticated", False)
                    response_data["user_email"] = session.get("user_email", "")
                
                response = JSONResponse(response_data)
                response.set_cookie("user_id", user_id)
                return response
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                assistant_message = res.text
                
                # Translate plain text response
                translated_response = translate_text(assistant_message, user_language, 'en')
                final_response = translated_response['translated_text']
                
                # Generate multilingual GTTS audio for plain text response
                gtts_audio_path = generate_multilingual_speech_audio(final_response, user_language)
                
                session["messages"].append({
                    "role": "assistant",
                    "content": final_response,
                    "original_content": assistant_message if translated_response['translation_needed'] else None,
                    "language": user_language,
                    "audio_path": None,
                    "gtts_audio_path": gtts_audio_path
                })
                
                response_data = {
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": final_response,
                    "original_response": assistant_message if translated_response['translation_needed'] else None,
                    "user_language": user_language,
                    "detected_language": detected_language,
                    "audio_path": None,
                    "gtts_audio_path": gtts_audio_path
                }
                
                response = JSONResponse(response_data)
                response.set_cookie("user_id", user_id)
                return response
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

# Update the get_session_api to include authentication status
@app.get("/api/session")
def get_session_api(request: Request):
    """Get current session data as JSON for the dashboard"""
    user_id = request.cookies.get("user_id", f"user-{uuid.uuid4()}")
    session = SESSIONS.get(user_id, {})
    
    response_data = {
        "user_id": user_id,
        "session_id": session.get("session_id"),
        "messages": session.get("messages", []),
        "authenticated": session.get("authenticated", False),
        "user_email": session.get("user_email", "")
    }
    
    response = JSONResponse(response_data)
    if user_id not in SESSIONS:
        response.set_cookie("user_id", user_id)
    
    return response
