import firebase_admin
from multitoolagent.sub_agents.auth_agent.agent import db 
import uuid
 

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