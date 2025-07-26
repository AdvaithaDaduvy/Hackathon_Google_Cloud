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


from google.cloud import vision
import base64

from vertexai.preview.generative_models import GenerativeModel, Image

def fix_base64_padding(b64_string: str) -> str:
    """Adds correct padding to a base64 string if missing."""
    return b64_string + '=' * (-len(b64_string) % 4)

def detect_fake_product(image_base64: str) -> str:
    """
    Uses Gemini model to analyze product packaging and detect label info.
    Returns detected product name, brand, and any visible authenticity cues.
    """
    try:
        # Fix base64 padding and decode
        fixed_b64 = fix_base64_padding(image_base64)
        image_data = base64.b64decode(fixed_b64)

        # Create Gemini image object
        gemini_image = Image.from_bytes(image_data)

        # Load Gemini model
        model = GenerativeModel("gemini-1.5-pro-vision")

        # Send image with prompt
        prompt = """
You are a product verification assistant for agriculture.
Examine this image of an agricultural product (like seed, pesticide, or fertilizer) and extract the following:
1. Product name
2. Brand name or company
3. Certification symbols or QR codes if visible
4. Any signs that the packaging might be fake

Reply in this format:

Product: ...
Brand: ...
Certifications: ...
Suspicious Signs: ...
"""
        response = model.generate_content([prompt, gemini_image])

        return response.text.strip()

    except base64.binascii.Error as b64_err:
        return f"❌ Invalid base64 input: {b64_err}"

    except Exception as e:
        return f"❌ Error processing image with Gemini: {e}"


from google.cloud import bigquery

def check_product_authenticity(product_text: str) -> str:
    """
    Looks up the product in the BigQuery untrustedaf_agri_products table.
    Returns whether the product is genuine or fake.
    """
    try:
        client = bigquery.Client()

        query = f"""
            SELECT product_name, brand, status
            FROM `kisaansaathi-466309.agri_data.untrustedaf_agri_products`
            WHERE LOWER(product_name) LIKE LOWER('%{product_text}%')
            LIMIT 1
        """

        result = client.query(query).result()
        row = next(iter(result), None)

        if row:
            if row.status.lower() == 'verified':
                return f"✅ Verified Product: {row.product_name} by {row.brand} [Status: {row.status}]"
            else:
                return f"⚠️ Product Found: {row.product_name} by {row.brand} [Status: {row.status} — May be fake or substandard]"
        else:
            return f"❌ No match found for '{product_text}' in the verified product database."

    except Exception as e:
        return f"❌ Error during authenticity check: {e}"



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
            to=f"whatsapp:+918106052094"  # Always send to this number
        )
        print(f"Message sent to {to_number} | SID: {msg.sid} | Status: {msg.status}")
        return f"✅ Sent to {to_number} (SID: {msg.sid}, Status: {msg.status})"
    except Exception as e:
        print(f"❌ Failed to send to {to_number}: {e}")
        return f"❌ Failed to send to {to_number}: {e}"




from vertexai.preview.generative_models import GenerativeModel

YOUR_WHATSAPP_NUMBER = "+918247010074"  # Always send to this number

def auto_order_verified_product(
    product_type: str,
    verified_product_name: str,
    brand: str,
    farmer_name: str = "the farmer",
    location: str = "unspecified"
) -> str:
    """
    Crafts a natural WhatsApp message to a vendor based on verified product info.
    Regardless of vendor mentioned, the message is always sent to YOUR number.
    """
    try:
        # Step 1: LLM crafts message with real vendor names for realism
        model = GenerativeModel("gemini-2.0-flash")

        prompt = f"""
You are writing a WhatsApp message from a farmer to a trusted vendor.

The farmer recently received an *unverified or fake product* and needs a *verified replacement* urgently.

Here are the details:
- Farmer Name: {farmer_name}
- Location: {location}
- Product Type: {product_type}
- Suspect Product: {brand} (e.g., Indofil M-45)
- Verified Alternative: {verified_product_name}

Write the message **as if it is from the farmer**, in a respectful, urgent tone. DO NOT include technical explanations, "recipient" tags, or system/internal notes. 

Keep it actionable. Do NOT say “this is a draft” or mention routing.
"""

        response = model.generate_content(prompt)
        crafted_message = response.text.strip()

        # Step 2: Send message to YOUR number regardless of vendor mentioned
        send_result = send_whatsapp_message(YOUR_WHATSAPP_NUMBER, crafted_message)

        return f"✅ Message crafted and sent to trusted handler.\n\n📩 Message:\n{crafted_message}\n\n{send_result}"

    except Exception as e:
        return f"❌ Error placing verified product order: {e}"


















beech_pehchan = Agent(
    name="beech_pehchan",
    model="gemini-2.0-flash",
    description="I detect fake or substandard agricultural products like seeds, fertilizers, and pesticides using image analysis and verified vendor databases.",
    instruction="""
You are Beech Pehchan – a quality-check assistant for farmers.

Your tasks:
1. Use the GCP Vision API to extract label/text from product images.
2. Cross-check product info with trusted vendor/product data from BigQuery.
3. If the product looks suspicious or is not found in verified sources, warn the farmer clearly.
4. Offer to auto-order a trusted and verified alternative if needed.

Keep responses short, simple, and useful. Avoid long explanations. Always guide the farmer clearly on what to do next.
""",
    tools=[
        detect_fake_product,
        check_product_authenticity,
        auto_order_verified_product,
        
    ]
)
