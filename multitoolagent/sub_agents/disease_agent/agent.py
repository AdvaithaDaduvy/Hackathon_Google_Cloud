from google.adk import Agent
import os
from dotenv import load_dotenv

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")

from vertexai.preview.generative_models import GenerativeModel
import vertexai

# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
model = GenerativeModel("gemini-2.0-flash")

import base64
from vertexai.preview.generative_models import Image, GenerativeModel


import requests


from twilio.rest import Client
import os

# Make sure these are in your .env
import os
import re
import base64
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
from twilio.rest import Client

# Load environment variables from .env file
load_dotenv()

# Twilio setup
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")  # Should be +14155238886 for sandbox


twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_whatsapp_message(to_number: str, message: str) -> str:
    """
    Sends a WhatsApp message using Twilio and returns status.
    """
    try:
        msg = twilio_client.messages.create(
            body=message,
            from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",  # Should be whatsapp:+14155238886 for sandbox
            to=f"whatsapp:+918106052094"
        )
        print(f"Message sent to {to_number} | SID: {msg.sid} | Status: {msg.status}")
        return f"✅ Sent to {to_number} (SID: {msg.sid}, Status: {msg.status})"
    except Exception as e:
        print(f"❌ Failed to send to {to_number}: {e}")
        return f"❌ Failed to send to {to_number}: {e}"

MY_TEST_NUMBER = "+918106052094" 
def order_treatment_supplies(treatment_description: str) -> str:
    model = GenerativeModel("gemini-2.0-flash")
    prompt = f"""
You're helping a farmer find agricultural suppliers.

Based on the treatment: '{treatment_description}', list 3 Indian vendors who typically supply such products.

For this demo, always use the contact number {MY_TEST_NUMBER} for all vendors, regardless of the actual vendor.

Format:
1. Vendor Name - {MY_TEST_NUMBER} - Location

Do not include disclaimers or explanations. Just return the list in the format above.
"""
    response = model.generate_content(prompt)
    vendor_info = response.text.strip()

    phone_numbers = re.findall(r"\+91\d{10}", vendor_info)
    send_results = []

    for number in phone_numbers:
        result = send_whatsapp_message(number, f"Hello! I need supplies for this treatment: {treatment_description}")
        send_results.append(result)

    full_result = f"📦 Vendor info:\n{vendor_info}\n\n" + "\n".join(send_results)
    return full_result

#here
from google.cloud import vision
import base64
import io
from vertexai.preview.generative_models import GenerativeModel, Image

def analyze_disease_symptoms(symptoms: str, base64_image: str = "") -> str:
    """
    Analyze disease symptoms and/or a base64-encoded image to provide a basic diagnosis 
    using Vision AI for image analysis and Gemini for diagnosis.
    """
    # Initialize Vision AI client
    vision_client = vision.ImageAnnotatorClient()

    prompt = ""
    vision_results = ""

    if base64_image:
        # Decode base64 image
        image_bytes = base64.b64decode(base64_image)
        
        # Create Vision AI image object
        image = vision.Image(content=image_bytes)
        
        # Perform label detection
        label_response = vision_client.label_detection(image=image)
        labels = label_response.label_annotations

        # Get plant disease-relevant labels
        plant_labels = [label.description for label in labels 
                       if any(term in label.description.lower() 
                       for term in ['plant', 'leaf', 'disease', 'spot', 'blight'])]
        
        # Add Vision AI results to prompt
        if plant_labels:
            vision_results = f"Vision AI detected: {', '.join(plant_labels)}. "
            prompt += f"Based on the image analysis showing {vision_results}"

    if symptoms:
        symptoms_lower = symptoms.lower()
        prompt += f"And analyzing these symptoms: {symptoms_lower}. "
    
    prompt += "Provide a detailed plant disease diagnosis and treatment recommendations."

    # Use Gemini model for final diagnosis
    model = GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)

    return response.text


 
def get_treatment_advice(disease_type: str) -> str:
    """
    Provide treatment recommendations
    """
    disease_lower = disease_type.lower()
    client = vertexai.preview.generative_models.GenerativeModel("gemini-2.0-flash")
    prompt = f"Provide treatment recommendations for the following disease: {disease_lower}. Include prevention advice."
    response = client.generate_content(prompt)  
    return response.text
    
   
# Create the disease detection agent
disease_agent = Agent(
    name="disease_agent",
    model="gemini-2.0-flash",
    description="I analyze plant diseases and provide treatment recommendations for farmers.",
    instruction="""
    You are a plant disease detection specialist. Your tasks are:
    
    1. Analyze symptoms described by farmers
    2. Identify potential diseases
    3. Recommend treatments
    4. List vendors with phone numbers who can supply treatment products
    5. Send WhatsApp messages to vendors on behalf of the farmer (this is done by your tool)
    """,
    tools=[analyze_disease_symptoms, get_treatment_advice, order_treatment_supplies],
)