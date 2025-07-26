import datetime
from google.adk import Agent
from vertexai.preview.generative_models import GenerativeModel
from vertexai.language_models import ChatModel
from multitoolagent.sub_agents.auth_agent.agent import db 
from firebase_admin import auth


model = GenerativeModel("gemini-2.0-flash")
# === HELPER ===

def _generate_fun_reminder(text: str) -> str:
    """Uses Gemini to turn a plain reminder into a fun, farmer-friendly reminder."""
    prompt = f"""
    Make this reminder message fun  for a farmer:
    "{text}"
    Include emojis and humor like "Modi ji rooth jayenge!".
    Keep it short and simple.
    """
    response = model.generate_content(prompt)
    return response.text.strip()

# === TOOL 1: CREATE REMINDER ===

def create_fun_reminder(email: str, title: str, date: str, time: str) -> str:
    """
    Adds a fun reminder for a farmer into their Firestore profile.
    date: 'YYYY-MM-DD'
    time: 'HH:MM' (24-hr)
    """

    user_record = auth.get_user_by_email(email)
    uid = user_record.uid
    farmer_ref = db.collection("farmers").document(uid)
    reminder_dt = datetime.datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    
    reminder_id = reminder_dt.strftime("%Y%m%d%H%M")
    reminder_text = f"{title} at {time} on {date}"
    fun_reminder = _generate_fun_reminder(reminder_text)
    
    reminder_data = {
        "title": title,
        "datetime": reminder_dt,
        "fun_text": fun_reminder,
    }

    farmer_ref.collection("reminders").document(reminder_id).set(reminder_data)
    return f"✅ Reminder added: {fun_reminder}"

# === TOOL 2: LIST TODAY’S REMINDERS ===

def list_today_reminders(email: str) -> str:
    """
    Lists today's reminders for the given farmer email in fun 'Kisaan Radio' style.
    """
    now = datetime.datetime.now()
    end_of_day = now.replace(hour=23, minute=59, second=59)

    user_record = auth.get_user_by_email(email)
    uid = user_record.uid
    reminders_ref = db.collection("farmers").document(uid).collection("reminders")
    reminders = reminders_ref.where("datetime", ">=", now).where("datetime", "<=", end_of_day).stream()

    messages = [r.to_dict()["fun_text"] for r in reminders]

    if not messages:
        return "🎙️ Kisaan Radio: Aaj koi reminder nahi hai, aaram karo kaka! 🧘‍♂️🌞"

    return "🎙️ Kisaan Radio:\n" + "\n".join(messages)


import random
from multitoolagent.sub_agents.auth_agent.agent import get_profile_details
from firebase_admin import auth

def general_updates() -> str:
    """
    Fetches a context-aware general update for the farmer based on their location and crop.
    Looks into the 'general_updates' Firestore collection.
    """
    from google.adk import ToolContext
    email = ToolContext.get("farmer_email")
    
    if not email:
        return "❗ Please sign in first to get general updates."

    # Get farmer profile
    profile = get_profile_details(email)
    location = profile.get("location", "").lower()
    crop = profile.get("crop", "").lower()

    # Step 1: Attempt to query matching location and crop-specific updates
    updates_ref = db.collection("general_updates")
    query = updates_ref.where("location", "==", location).stream()

    matching_updates = []
    for doc in query:
        update = doc.to_dict()
        tags = [t.lower() for t in update.get("tags", [])]
        if crop in tags or "general" in tags:
            matching_updates.append(update.get("message"))

    # Step 2: Fallback to general updates (no location match)
    if not matching_updates:
        general_query = updates_ref.where("location", "==", "general").stream()
        for doc in general_query:
            update = doc.to_dict()
            matching_updates.append(update.get("message"))

    if not matching_updates:
        return random.choice([
            "🌾 Kisaan Radio: Aaj ka din kheti ke liye uttam hai! Mausam saaf hai aur mann bhi!",
            "📻 Kisaan Radio: Beej sambhal ke rakhiye, naya season door nahi!",
            "☀️ Kisaan Radio: Gehu ki mandi mein achhe daam mil rahe hain. Nazar banaye rakhein!"
        ])

    return f"🎙️ Kisaan Radio: {random.choice(matching_updates)}"


# === AGENT ===

kisaan_radio_agent = Agent(
    name="kisaan_radio_agent",
    model="gemini-2.0-flash",
    description="Creates and reads fun reminders for farmers from their Firestore profile.",
    instruction="""
    You're Kisaan Radio 📻 — a cheerful agent that helps farmers remember important tasks with fun messages!
    You use funny tone, emojis, and simple Hindi-English to explain.
    
    When asked to list reminders, you read them out in a fun radio style.
    When asked to create a reminder, you make it fun and memorable and keep it short.
    
    """,
    tools=[create_fun_reminder, list_today_reminders,general_updates]
)