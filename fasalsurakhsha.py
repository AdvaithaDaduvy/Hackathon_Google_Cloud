from google.adk.agents import LlmAgent

from vertexai.preview.generative_models import GenerativeModel, Part
from PIL import Image

# Set up the model with image support

model = GenerativeModel("gemini-2.5-flash")



# Fasal Suraksha Agent
fasal_suraksha_agent = LlmAgent(
    name="FasalSurakshaAgent",
    model=model,
    instruction="""
You are a crop disease detection agent.

You will be given a photo of a plant or leaf showing symptoms. Your job is to:
1. Identify the crop (e.g., tomato, rice, wheat).
2. Identify the most probable disease visible in the image.
3. Suggest a suitable treatment or farming intervention.

Respond strictly in the format:

**Crop:** <Crop Name>  
**Disease:** <Disease Name>  
**Treatment:** <Concise remedy and steps>
""",
    description="Analyzes crop leaf image and suggests disease + treatment.",
    output_key="crop_diagnosis_result"
)

def detect_crop_disease(image_path: str) -> str:
    model = GenerativeModel("gemini-2.5-flash")
    prompt = (
        "You are a crop disease detection agent. "
        "Analyze the attached image and respond strictly in the format:\n"
        "**Crop:** <Crop Name>\n"
        "**Disease:** <Disease Name>\n"
        "**Treatment:** <Concise remedy and steps>"
    )
    with Image.open(image_path) as img:
        image_part = Part.from_image(img)
        response = model.generate_content([prompt, image_part])
    return response.text.strip()

if __name__ == "__main__":
    image_path = "plent.jpg"  # Replace with your image path
    print(detect_crop_disease(image_path))
