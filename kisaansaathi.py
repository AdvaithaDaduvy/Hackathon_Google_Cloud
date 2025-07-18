
#Recognize user speech input using Google Speech Recognition API

import speech_recognition as sr

def get_voice_input():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("🎤 Listening...")
        audio = r.listen(source)

    try:
        text = r.recognize_google(audio, language='en')  # Hindi, change as needed
        print(len(text))
        print("🗣️ You said:", text)
        return text
    except Exception as e:
        return "Error recognizing speech: " + str(e)
    
    
from vertexai.preview.generative_models import GenerativeModel
import vertexai

vertexai.init(project="kisaansaathi-466309", location="us-central1")


def classify_intent_gemini(user_input):
    model = GenerativeModel("gemini-2.5-flash")
    prompt = f"""
    Classify the farmer query into one of these intents:
    [disease_detection, scheme_application, market_forecast, crop_loss, fake_detection]
    
    Query: "{user_input}"
    Intent:
    """
    response = model.generate_content(prompt)
    return response.text.strip().lower()


if __name__ == "__main__":
    user_input = get_voice_input()
    if user_input:
        intent = classify_intent_gemini(user_input)
        print("📝 Classified Intent:", intent)
    else:
        print("❌ No input received.")