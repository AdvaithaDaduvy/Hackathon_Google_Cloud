import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.adk import Agent


cred = credentials.Certificate("C:\\Users\\ADMIN\\Desktop\\Research\\hackathon_googlecloud\\multitoolagent\\sub_agents\\ngo_alerts_agent\\kisaansaathi-b2149-firebase-adminsdk-fbsvc-721c59646c.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()


def register_farmer(email: str, password: str, name: str) -> str:
    """
    Registers a farmer in Firebase Auth and Firestore.
    Returns the farmer's unique ID.
    """
    if not email or not password or not name:
        return {
            "type": "form",
            "message": "🔐 Please enter your email and password to sign in.",
            "fields": [
                {"label": "Email", "name": "email", "type": "text"},
                {"label": "Password", "name": "password", "type": "password"}
            ],
            "actions": [
                {"label": "Sign In", "value": "sign_in"}
            ]
        }
    try:
        # Step 1: Create user in Firebase Auth
        user_record = auth.create_user(email=email, password=password)
        uid = user_record.uid

        # Step 2: Save farmer data in Firestore
        data = {
            "name": name,
            "email": email,
        }
        db.collection("farmers").document(uid).set(data)

        return uid

    except Exception as e:
        return f"Registration failed: {str(e)}"

def sign_in_farmer(email: str, password: str) -> str:
    """
    Signs in the farmer using Firebase Auth, fetches user details from Firestore,
    and sets it in the ToolContext so that all agents can access it.
    """
    try:
        # Step 1: Get user by email
        user_record = auth.get_user_by_email(email)
        uid = user_record.uid

        # Step 2: (Optional) Verify password - Firebase Admin SDK does not support password verification.
        # You should handle password verification on the client side or use a custom authentication flow.

        # Step 3: Fetch farmer details from Firestore
        doc = db.collection("farmers").document(uid).get()
        farmer_data = doc.to_dict() if doc.exists else None

        if not farmer_data:
            return "No farmer data found in the database."

        # Step 4: Set farmer data into ADK context
        

        return f"Signed in successfully. Welcome, {farmer_data.get('name', 'Farmer')}!"

    except Exception as e:
        return f"Sign-in failed: {str(e)}"

def get_profile_details(email: str) -> dict:
    """
    Fetches the farmer's profile details from Firestore.
    """
    try:
        user_record = auth.get_user_by_email(email)
        uid = user_record.uid

        doc = db.collection("farmers").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        else:
            return {"error": "No profile found for this email."}
    except Exception as e:
        return {"error": str(e)}

auth_agent = Agent(
    name="auth_agent",
    model="gemini-2.0-flash", 
    description="Helps farmers with authentication and profile management.",
    instruction="""
    You assist farmers in signing up, logging in, and managing their profiles.
    - Collect email and password for authentication
    - Allow farmers to update their profile information
    - Ensure secure handling of sensitive data
    and Then:
    - Provide feedback on the success or failure of authentication attempts
    - Use the same details to set the farmer's context in the ADK.
    - Use the same details for all other agents to access the farmer's profile.
    """,
    tools=[sign_in_farmer, register_farmer],
)








# auth_agent = Agent(
#     name="auth_agent",
#     model="gemini-2.0-flash", 
#     description="Helps farmers with authentication and profile management.",
#     instruction="""
#     You assist farmers in signing up, logging in, and managing their profiles.
#     - Collect email and password for authentication
#     - Allow farmers to update their profile information
#     - Make sure the you use the same farmer account and that account details throught the session for all agents.
#     - Ensure secure handling of sensitive data
#     and Then:
#     - Provide feedback on the success or failure of authentication attempts
#     - Use the same details to set the farmer's context in the ADK.
#     - Use the same details for all other agents to access the farmer's profile.
#     """,
#     tools=[sign_in_farmer, register_farmer],
# )