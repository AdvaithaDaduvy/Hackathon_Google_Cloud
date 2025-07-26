# Add these imports to your FastAPI backend (main.py)
from gtts import gTTS
import os
import uuid
import tempfile
from pathlib import Path
import logging
from googletrans import Translator

# Initialize translator
translator = Translator()

# Create audio directory if it doesn't exist
AUDIO_DIR = Path("static/audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Add this to your existing FastAPI backend after the existing imports
import io
import base64

def generate_speech_audio(text: str, language: str = "en") -> str:
    """
    Generate speech audio using Google Text-to-Speech (GTTS) with Indian accents
    Returns the path to the generated audio file
    """
    try:
        # Clean text for better speech - more comprehensive cleaning
        clean_text = text.replace("🌾", "").replace("🌱", "").replace("🛡️", "").replace("📈", "").replace("📋", "").replace("🚨", "").replace("📻", "").replace("✅", "").replace("❌", "")
        clean_text = clean_text.replace("**", "").replace("*", "").replace("`", "")
        clean_text = clean_text.replace("#", "").strip()
        
        # Additional cleaning for better pronunciation
        clean_text = clean_text.replace("KisaanSaathi", "Kisaan Saathi")
        clean_text = clean_text.replace("AI", "A I")
        clean_text = clean_text.replace("API", "A P I")
        clean_text = clean_text.replace("GTTS", "G T T S")
        clean_text = clean_text.replace("WhatsApp", "WhatsApp")
        clean_text = clean_text.replace("NGO", "N G O")
        
        # Replace technical terms with more pronounceable versions
        clean_text = clean_text.replace("backend", "back end")
        clean_text = clean_text.replace("frontend", "front end")
        clean_text = clean_text.replace("multilingual", "multi lingual")
        
        # Add pauses for better speech flow
        clean_text = clean_text.replace(".", ". ")
        clean_text = clean_text.replace("!", "! ")
        clean_text = clean_text.replace("?", "? ")
        clean_text = clean_text.replace(":", ": ")
        clean_text = clean_text.replace(";", "; ")
        
        # Remove extra spaces
        clean_text = " ".join(clean_text.split())
        
        if not clean_text:
            return None
            
        # Generate unique filename
        audio_filename = f"speech_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = AUDIO_DIR / audio_filename
        
        # Map languages to Indian accent variants where available
        language_mapping = {
            'en': 'en-in',  # English (India) - Indian accent
            'hi': 'hi-in',  # Hindi (India)
            'bn': 'bn-in',  # Bengali (India)
            'te': 'te-in',  # Telugu (India)
            'mr': 'mr-in',  # Marathi (India)
            'ta': 'ta-in',  # Tamil (India)
            'gu': 'gu-in',  # Gujarati (India)
            'kn': 'kn-in',  # Kannada (India)
            'ml': 'ml-in',  # Malayalam (India)
            'pa': 'pa-in',  # Punjabi (India)
            'or': 'or-in',  # Odia (India)
            'as': 'as-in',  # Assamese (India)
            'ur': 'ur-in'   # Urdu (India)
        }
        
        # Use Indian variant if available, otherwise fallback to original
        tts_language = language_mapping.get(language, language)
        
        # Create gTTS object with Indian accent and optimized settings
        tts = gTTS(
            text=clean_text, 
            lang=tts_language, 
            slow=False,  # Normal speed for better clarity
            tld='co.in'  # Use Indian domain for better Indian accent
        )
        
        # Save audio file
        tts.save(str(audio_path))
        
        # Return relative path for frontend
        return f"/static/audio/{audio_filename}"
        
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        # Fallback to English (India) if specific language fails
        if language != 'en':
            try:
                logger.info(f"Falling back to English (India) for text: {clean_text[:50]}...")
                tts_fallback = gTTS(
                    text=clean_text, 
                    lang='en-in', 
                    slow=False,
                    tld='co.in'
                )
                tts_fallback.save(str(audio_path))
                return f"/static/audio/{audio_filename}"
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")
        return None

def cleanup_old_audio_files():
    """Clean up audio files older than 1 hour"""
    try:
        import time
        current_time = time.time()
        for audio_file in AUDIO_DIR.glob("*.mp3"):
            if current_time - audio_file.stat().st_mtime > 3600:  # 1 hour
                audio_file.unlink()
    except Exception as e:
        logger.error(f"Error cleaning up audio files: {e}")

# Update your send_message_api function to include improved GTTS
@app.post("/api/send_message")
def send_message_api(request: Request, message_data: MessageRequest):
    user_id = request.cookies.get("user_id")
    session = SESSIONS.get(user_id)
    
    logger.info(f"API: Received message from user {user_id}: {message_data.message}")
    
    if not session:
        logger.warning(f"No session found for user {user_id}")
        # Auto-create session logic (keep existing code)
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
                
                # Generate improved GTTS audio for assistant message with Indian accent
                gtts_audio_path = None
                if assistant_message:
                    logger.info("Generating improved GTTS audio with Indian accent for assistant response...")
                    gtts_audio_path = generate_speech_audio(assistant_message, 'en')  # Default to English (India)
                    if gtts_audio_path:
                        logger.info(f"Improved GTTS audio generated: {gtts_audio_path}")
                    else:
                        logger.warning("Failed to generate improved GTTS audio")
                
                if assistant_message:
                    session["messages"].append({
                        "role": "assistant",
                        "content": assistant_message,
                        "audio_path": audio_path,  # Keep original audio if available
                        "gtts_audio_path": gtts_audio_path  # Add improved GTTS audio path
                    })
                
                # Clean up old audio files periodically
                cleanup_old_audio_files()
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": assistant_message,
                    "audio_path": audio_path,
                    "gtts_audio_path": gtts_audio_path,  # Include improved GTTS audio path in response
                    "raw_response": events
                })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                assistant_message = res.text
                
                # Generate improved GTTS audio for plain text response
                gtts_audio_path = generate_speech_audio(assistant_message, 'en')
                
                session["messages"].append({
                    "role": "assistant",
                    "content": assistant_message,
                    "audio_path": None,
                    "gtts_audio_path": gtts_audio_path
                })
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": assistant_message,
                    "audio_path": None,
                    "gtts_audio_path": gtts_audio_path
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

# Add endpoint to test improved GTTS directly
@app.post("/api/test_gtts")
def test_gtts(text_data: dict):
    """Test improved GTTS functionality with Indian accent"""
    text = text_data.get("text", "Hello! This is a test of Google Text to Speech with Indian accent. Welcome to Kisaan Saathi agricultural platform.")
    language = text_data.get("language", "en")
    
    try:
        audio_path = generate_speech_audio(text, language)
        if audio_path:
            return {
                "success": True,
                "audio_path": audio_path,
                "message": "Improved GTTS audio with Indian accent generated successfully",
                "language_used": language
            }
        else:
            return {
                "success": False,
                "error": "Failed to generate improved GTTS audio"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Add requirements for improved GTTS
# You'll need to install: pip install gtts googletrans==4.0.0rc1
