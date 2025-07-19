import firebase_admin
from firebase_admin import credentials, firestore
import uuid

cred = credentials.Certificate("C:/Users/kavya/OneDrive/Desktop/hackathon_googlecloud/hackathon_googlecloud/kisaansaathi-da64d-firebase-adminsdk-fbsvc-6ee67f225d.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def save_farmer_data(farmer_id, data: dict):
    db.collection("farmers").document(farmer_id).set(data)

def get_farmer_data(farmer_id):
    return db.collection("farmers").document(farmer_id).get().to_dict()



def register_farmer(name, aadhar, phone, land_details, bank_details):
    farmer_id = str(uuid.uuid4())

    data = {
        "name": name,
        "aadhar": aadhar,
        "phone": phone,
        "land_details": land_details,
        "bank_details": bank_details,
        "status": "PENDING_FORM"
    }

    save_farmer_data(farmer_id, data)


    form_link = f"https://your-app-url.com/farmer-form?fid={farmer_id}"
    return f"Your data has been saved securely. Please complete your PM-KISAN application by visiting: {form_link}"