# Add these imports to your FastAPI backend (main.py)
from googletrans import Translator
import os
import uuid
import tempfile
from pathlib import Path
from gtts import gTTS
from logging import logger 

# Initialize translator
translator = Translator()

# Supported languages for KisaanSaathi
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi (हिंदी)',
    'bn': 'Bengali (বাংলা)',
    'te': 'Telugu (తెలుగు)',
    'mr': 'Marathi (मराठी)',
    'ta': 'Tamil (தமிழ்)',
    'gu': 'Gujarati (ગુજરાતી)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'ml': 'Malayalam (മലയാളം)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
    'or': 'Odia (ଓଡ଼ିଆ)',
    'as': 'Assamese (অসমীয়া)',
    'ur': 'Urdu (اردو)'
}

def detect_language(text: str) -> str:
    """
    Detect the language of input text
    Returns language code (e.g., 'hi', 'en', 'bn')
    """
    try:
        detection = translator.detect(text)
        detected_lang = detection.lang
        
        # If detected language is supported, return it
        if detected_lang in SUPPORTED_LANGUAGES:
            return detected_lang
        
        # Default to English if not supported
        return 'en'
    except Exception as e:
        logger.error(f"Language detection error: {e}")
        return 'en'

def translate_text(text: str, target_language: str, source_language: str = 'auto') -> dict:
    """
    Translate text to target language
    Returns dict with translated text and metadata
    """
    try:
        # If source and target are the same, no translation needed
        if source_language == target_language:
            return {
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'translation_needed': False
            }
        
        # Perform translation
        result = translator.translate(text, dest=target_language, src=source_language)
        
        return {
            'translated_text': result.text,
            'source_language': result.src,
            'target_language': target_language,
            'translation_needed': True,
            'confidence': getattr(result, 'confidence', None)
        }
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return {
            'translated_text': text,
            'source_language': source_language,
            'target_language': target_language,
            'translation_needed': False,
            'error': str(e)
        }

def generate_multilingual_speech_audio(text: str, language: str = "en") -> str:
    """
    Generate speech audio using Google Text-to-Speech with language support
    Returns the path to the generated audio file
    """
    try:
        # Clean text for better speech
        clean_text = text.replace("🌾", "").replace("🌱", "").replace("🛡️", "").replace("📈", "").replace("📋", "").replace("🚨", "").replace("📻", "").replace("✅", "").replace("❌", "")
        clean_text = clean_text.replace("**", "").replace("*", "").replace("`", "")
        clean_text = clean_text.replace("#", "").strip()
        
        if not clean_text:
            return None
            
        # Generate unique filename with language code
        audio_filename = f"speech_{language}_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = AUDIO_DIR / audio_filename
        
        # Create gTTS object with specified language
        tts = gTTS(text=clean_text, lang=language, slow=False)
        
        # Save audio file
        tts.save(str(audio_path))
        
        # Return relative path for frontend
        return f"/static/audio/{audio_filename}"
        
    except Exception as e:
        logger.error(f"Error generating multilingual speech: {e}")
        # Fallback to English if language not supported
        if language != 'en':
            return generate_multilingual_speech_audio(text, 'en')
        return None

# Add language preference to session management
def get_user_language_preference(user_id: str) -> str:
    """Get user's preferred language from session or default to English"""
    session = SESSIONS.get(user_id, {})
    return session.get('preferred_language', 'en')

def set_user_language_preference(user_id: str, language: str):
    """Set user's preferred language in session"""
    if user_id in SESSIONS:
        SESSIONS[user_id]['preferred_language'] = language
    else:
        SESSIONS[user_id] = {'preferred_language': language}

# Add new API endpoints for multilingual support
@app.get("/api/supported_languages")
def get_supported_languages():
    """Get list of supported languages"""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "default": "en"
    }

@app.post("/api/set_language")
def set_language_preference(request: Request, language_data: dict):
    """Set user's preferred language"""
    user_id = request.cookies.get("user_id")
    language = language_data.get("language", "en")
    
    if not user_id:
        return {"success": False, "error": "No user session found"}
    
    if language not in SUPPORTED_LANGUAGES:
        return {"success": False, "error": "Language not supported"}
    
    set_user_language_preference(user_id, language)
    
    return {
        "success": True,
        "language": language,
        "language_name": SUPPORTED_LANGUAGES[language]
    }

@app.post("/api/translate")
def translate_message(request: Request, translation_data: dict):
    """Translate a message to specified language"""
    text = translation_data.get("text", "")
    target_language = translation_data.get("target_language", "en")
    source_language = translation_data.get("source_language", "auto")
    
    if not text:
        return {"success": False, "error": "No text provided"}
    
    result = translate_text(text, target_language, source_language)
    
    return {
        "success": True,
        "original_text": text,
        **result
    }

@app.post("/api/detect_language")
def detect_message_language(text_data: dict):
    """Detect the language of input text"""
    text = text_data.get("text", "")
    
    if not text:
        return {"success": False, "error": "No text provided"}
    
    detected_lang = detect_language(text)
    
    return {
        "success": True,
        "text": text,
        "detected_language": detected_lang,
        "language_name": SUPPORTED_LANGUAGES.get(detected_lang, "Unknown")
    }

# Update the send_message_api function to include multilingual support
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
                        "messages": [],
                        "preferred_language": "en"  # Default language
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
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": final_response,
                    "original_response": assistant_message if translated_response['translation_needed'] else None,
                    "user_language": user_language,
                    "detected_language": detected_language,
                    "audio_path": audio_path,
                    "gtts_audio_path": gtts_audio_path,  # Include multilingual GTTS audio path in response
                    "raw_response": events
                })
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
                
                return JSONResponse({
                    "success": True,
                    "messages": session["messages"],
                    "latest_response": final_response,
                    "original_response": assistant_message if translated_response['translation_needed'] else None,
                    "user_language": user_language,
                    "detected_language": detected_language,
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

# Add endpoint to test multilingual functionality
@app.post("/api/test_multilingual")
def test_multilingual(test_data: dict):
    """Test multilingual translation and TTS functionality"""
    text = test_data.get("text", "Hello! This is a test of multilingual support.")
    language = test_data.get("language", "hi")
    
    try:
        # Test translation
        translation_result = translate_text(text, language, 'en')
        
        # Test multilingual TTS
        audio_path = None
        if translation_result['translated_text']:
            audio_path = generate_multilingual_speech_audio(translation_result['translated_text'], language)
        
        return {
            "success": True,
            "original_text": text,
            "translated_text": translation_result['translated_text'],
            "language": language,
            "language_name": SUPPORTED_LANGUAGES.get(language, "Unknown"),
            "audio_path": audio_path,
            "translation_metadata": translation_result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Add requirements for multilingual support
# You'll need to install: pip install googletrans==4.0.0rc1
