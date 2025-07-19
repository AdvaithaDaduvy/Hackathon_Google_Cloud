from google.adk import Agent
import os
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
from .firebase_helper import save_farmer_data
import uuid
import vertexai


load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")


# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
model = GenerativeModel("gemini-2.5-flash")

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

    # 3. Generate a link
    link = f"https://your-domain.com/pm-kisan-form?fid={farmer_id}"

    return (
        f"{gemini_response.text.strip()}\n\n"
        f"✅ To apply directly, fill this form: {link}"
    )



scheme_agent = Agent(
    name="scheme_agent",
    model="gemini-2.0-flash",
    description="I analyze agricultural schemes and provide recommendations for farmers.",
    instruction="""
    You are an agricultural scheme specialist. Your job is to:

    1. Get the latest information on government schemes and subsidies for farmers.
    2. Summarise the key benefits and eligibility criteria of various schemes in a simple manner.
    3. Provide recommendations for scheme participation
    4. ask farmers if they want to apply for a scheme and apply on their behalf if they agree.

    Use the available tools to help diagnose diseases and provide practical solutions.
    Always ask for more details if the symptoms are unclear.
    """,
    tools=[apply_for_pm_kisan],
)