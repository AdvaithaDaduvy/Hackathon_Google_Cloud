import firebase_admin
from multitoolagent.sub_agents.scheme_agent.firebase_helper import db 
import uuid

# cred = credentials.Certificate("C:/Users/kavya/OneDrive/Desktop/hackathon_googlecloud/hackathon_googlecloud/kisaansaathi-da64d-firebase-adminsdk-fbsvc-6ee67f225d.json")
# firebase_admin.initialize_app(cred)
# db = firestore.client()

def save_crop_loss_report(report: dict) -> str:
    report_id = str(uuid.uuid4())
    db.collection("crop_loss_reports").document(report_id).set(report)
    return report_id