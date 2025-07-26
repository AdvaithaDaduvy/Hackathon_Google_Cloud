from dotenv import load_dotenv
import os

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")

from vertexai.preview.generative_models import GenerativeModel
import vertexai

# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
# model = GenerativeModel("gemini-1.5-flash")
# response = model.generate_content("Hello, who are you?")
# print("Agent:", response.text)
model = GenerativeModel("gemini-2.0-flash-live")


from google.adk.agents import Agent


def tool1():
    return "Tool 1 executed successfully."


root_agent = Agent(
    name="testagent",
    model="gemini-2.5-flash",
    description=(
        "summarize the response of the outputs after using tools"
    ),
    instruction=(
        "You are a helpful agent who summarizes the outputs of the tools used. "
    ),
    tools=[tool1],
)





