from google.adk import Agent
from vertexai.preview.generative_models import GenerativeModel
import vertexai
from google.adk.tools import FunctionTool
from google.adk.tools.google_search_tool import GoogleSearchTool
import re
import os
from dotenv import load_dotenv
from .firebase_helper import save_crop_loss_report
from .email_sender import send_email
from google.adk.tools import ToolContext
from typing import Optional

# Disable OpenTelemetry SDK to avoid conflicts
os.environ["OTEL_SDK_DISABLED"] = "true"
load_dotenv()
vertexai.init(project=os.getenv("GOOGLE_CLOUD_PROJECT"), location=os.getenv("GOOGLE_CLOUD_LOCATION"))

model = GenerativeModel("gemini-2.0-flash")

def generate_report_content(farmer_data: dict) -> str:
    prompt = f"""
    Generate a list of NGOs applicaple based on location and detailed and formal crop loss report for NGO/government intervention based on the following data:
    - Farmer Name: {farmer_data.get("name")}
    - Location: {farmer_data.get("location")}
    - Type of Loss: {farmer_data.get("loss_type")}
    - Date of Loss: {farmer_data.get("loss_date")}
    - Crop Affected: {farmer_data.get("crop")}
    - Area (in acres): {farmer_data.get("area")}
    - Description: {farmer_data.get("description")}
    - Estimated Loss (₹): {farmer_data.get("estimated_loss")}
    - Proof URLs: {farmer_data.get("proof_urls")}

    Make simple and on point covering major aspects. Make sure to sound formal and appropriate for NGO/government reading.

    """
    response = model.generate_content(prompt)
    return response.text.strip()


def handle_farmer_loss(farmer_data: dict, confirmation: Optional[str] = None) -> str:
    # Step 1: Store in Firebase
    farmer_id = save_crop_loss_report(farmer_data)

    # Step 2: Generate formal report content (text)
    report_text = generate_report_content(farmer_data)

    # Step 3: Ask for farmer confirmation via ADK UI
    if confirmation is None:
        return {
            "type": "prompt",
            "message": (
                "📄 Here is the generated crop loss report:\n\n"
                f"{report_text}\n\n"
                "Do you want to send this report to the NGO?"
            ),
            "actions": [
                {"label": "Yes, send report", "value": "yes"},
                {"label": "No, do not send", "value": "no"}
            ]
        }

    if confirmation.lower() not in ["yes", "y"]:
        return "❌ Report was not sent. Let us know if you'd like to edit or resubmit."

    # Step 4: Send Email
    ngo_email = "xyz@gmail.com"
    send_email(
        to=ngo_email,
        subject=f"Crop Loss Report - {farmer_data.get('name')} ({farmer_data.get('location')})",
        message_text=report_text
    )

    # Step 5: Return success response
    return f"✅ Report submitted successfully!\n\n📧 Formal report sent to {ngo_email}"


# def find_legit_ngo_emails(location: str):
#     prompt = f"""    Find legitimate NGO or government body emails for crop loss assistance in {location}.
#     Provide a list of emails with names and small description of what they do in the format:
#     [   {"name": "NGO Name", "email": "ngo@example.com", "description": "Helps farmers with crop loss"},
#         {"name": "Government Body", "email": "gov@example.com", "description": "Provides agricultural support"}
#     ]"""
#     output = model.generate_content(prompt).text.strip()

# # Get the results from the output
#     results = output.get("results", [])
#     emails = {}
#     for r in results:
#         title = r.get("title")
#         snippet = r.get("snippet", "")
#         m = re.search(r"([a-zA-Z0-9.\-+_]+@[a-zA-Z0-9.\-+_]+\.[a-zA-Z]+)", snippet)
#         if m:
#             emails[m.group(1)] = title
#     return [{"email": e, "name": name or e} for e, name in emails.items()]

# def handle_farmer_loss(farmer_data: dict) -> str:
#     # 1. Find NGO list
#     ngo_list = find_legit_ngo_emails(farmer_data["location"])
#     if not ngo_list:
#         return "❌ No NGO or government contacts found for this location."

#     # 2. Show available NGO options
#     print("Found these NGOs:")
#     for i, ngo in enumerate(ngo_list):
#         print(f"{i + 1}: {ngo['name']} ({ngo['email']})")

#     # 3. Show report content
#     report = generate_report_content(farmer_data)
#     prompt = f""" show him the {report} confirm if the farmer wants to send this. If yes send it to {selected['email']}"""
#     response = model.generate_content(prompt)
#     print(f"Generated Report:\n{report}\n\n{response.text.strip()}")

#     # 4. Send to first NGO in the list (simplified)
#     if "yes" in response.text.strip().lower():
#         selected = ngo_list[0]
#         send_email(
#             to="kavyastanley7027@gmail.com",
#             subject=f"Crop Loss Report – {farmer_data['name']} ({farmer_data['location']})",
#             message_text=report,
#         )

#     # 5. Save the record
#     save_crop_loss_report(farmer_data, selected["email"])

#     return f"✅ Report sent to {selected['name']} ({selected['email']})"


ngo_alerts_agent = Agent(
    name="ngo_alerts_agent",
    model="gemini-2.0-flash",
    description="Helps farmers report crop losses and alerts NGOs/government bodies.",
    instruction="""
    You collect crop loss details from farmers, including:
    - Name, location, date of loss, crop type, description
    - Area affected, estimated loss, proof photos or videos (URLs)
    
    Then:
    - Generate a formal report
    - Store data in Firebase
    - Email the report to the chosen NGO
    - Give the farmer a link to download the report
    """,
    tools=[handle_farmer_loss, generate_report_content ],
)
