from google.adk import Agent
import os
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
from .firebase_helper import save_farmer_data, get_farmer_data
import uuid
import vertexai


load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")


# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
model = GenerativeModel("gemini-2.0-flash-exp ")

def apply_for_pm_kisan(farmer_profile: dict) -> str:
    # 1. Use Gemini to analyze and recommend schemes
    prompt = (
        f"Here is the profile of a farmer:\n{farmer_profile}\n\n"
        "Based on this, suggest suitable Indian government agricultural schemes like PM-KISAN. "
        "For each scheme, give name, eligibility, benefits, and application steps in simple terms. "
        "Then ask: Do you want to apply for one of these schemes?"
    )
    gemini_response = model.generate_content(prompt)

    # 2. Save farmer details in Firebase
    farmer_id = str(uuid.uuid4())
    save_farmer_data(farmer_id, {**farmer_profile, "status": "AWAITING_CONFIRMATION"})
    get_farmer_data(farmer_id)

    # 3. Generate a link
    link = f"https://your-domain.com/pm-kisan-form?fid={farmer_id}"

    return (
        f"{gemini_response.text.strip()}\n\n"
        f"✅ To apply directly, fill this form: {link}"
    )




scheme_agent = Agent(
    name="scheme_agent",
    model="gemini-2.0-flash-exp", 
    description="I analyze agricultural schemes and provide recommendations for farmers.",
    instruction="""
You help farmers access government schemes and subsidies.

Responsibilities:
1. Fetch latest scheme info (benefits, eligibility, deadlines).
2. Summarize in simple terms.
3. Recommend relevant schemes to the farmer.
4. Ask if the farmer wants to apply. If yes, fill the draft application.
5. Offer to set a reminder for the deadline.
6. Store farmer details and show the draft if requested.

Keep all responses brief and easy to understand. Don't over-explain. Focus on helping the farmer take action.
""",
    tools=[apply_for_pm_kisan],
)