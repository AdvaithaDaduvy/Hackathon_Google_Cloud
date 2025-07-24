from google.adk import Agent
import os
import requests
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
import vertexai


load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")



# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
model = GenerativeModel("gemini-1.5-flash")
tools = [{'google_search': {}}]
config = {"response_modalities": ["TEXT"], "tools": tools}

# def get_market_price(api_key: str, state: str, district: str, commodity: str):
#     url = "https://api.data.gov.in/resource/f9ef22d6-3c3e-490c-a9cc-25d0981a63b3"
    
#     params = {
#         "api-key": api_key,
#         "format": "json",
#         "filters[state]": state,
#         "filters[district]": district,
#         "filters[commodity]": commodity,
#         "limit": 10
#     }
    
#     response = requests.get(url, params=params)
#     try:
#         json_data = response.json()
#         return json_data.get("records", [])
#     except Exception as e:
#         return []  # return empty list on any failure

def analyse_market_trends(state: str, district: str, commodity: str) -> str:
    """
    Analyze current market trends for a specific location and commodity.
    """
    # api_key = "579b464db66ec23bdd0000019d53946d6bad45566a95194a8c5a3b37"  # Replace with your actual API key
    # market_data = get_market_price(api_key, state, district, commodity)
    
    # if not isinstance(market_data, list) or not market_data:
    #     return "No market data available for the given inputs."
    
    # try:
    #     structured_data = "\n".join([
    #         f"{item.get('commodity', 'N/A')} at {item.get('market', 'N/A')} on {item.get('arrival_date', 'N/A')}: ₹{item.get('modal_price', 'N/A')} per quintal"
    #         for item in market_data
    #     ])
    # except Exception as e:
    #     return f"Error processing market data: {e}"
    
    prompt = (
        # f"The following data shows recent mandi prices for {commodity} in {district}, {state}:\n\n"
        # f"{structured_data}\n\n"
        f"provide the real time market price for {commodity} in {district}, {state}.\n"
        "Analyze the trends and provide insights on current market conditions, including price fluctuations, demand. Use the google search tool to find the latest information.\n"
    )
    response = model.generate_content(prompt)
    return response.text.strip()

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error from Gemini model: {e}"
 

market_agent = Agent(
    name="market_agent",
    model="gemini-2.0-flash",
    description="I analyze market trends and provide recommendations for farmers.",
    instruction=""" 
    Use the google search tool to help diagnose diseases and provide practical solutions.
    Always ask for more details if the symptoms are unclear.
    """,
    tools=[analyse_market_trends],
)