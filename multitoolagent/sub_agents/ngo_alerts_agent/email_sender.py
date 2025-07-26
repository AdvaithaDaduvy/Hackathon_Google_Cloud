import os
import base64
from email.mime.text import MIMEText
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import pickle

# Step 1: Define the scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# Step 2: Authenticate
def get_gmail_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'C:\\Users\\ADMIN\\Desktop\\Research\\hackathon_googlecloud\\multitoolagent\\client_secret_2_533188131034-pf04nucdlmd8dftnordh9rdfnijq292o.apps.googleusercontent.com.json', SCOPES)
            creds = flow.run_local_server(port=8081)

        # Save the credentials for future use
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    service = build('gmail', 'v1', credentials=creds)
    return service

# Step 3: Create and send message
def send_email(to, subject, message_text):
    service = get_gmail_service()

    message = MIMEText(message_text)
    message['to'] = to
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    body = {'raw': raw}
    message = service.users().messages().send(userId='me', body=body).execute()
    print(f"Message sent. ID: {message['id']}")


if __name__ == "__main__":
    # Example usage
    ngo_email = "n.kavya1603@gmail.com"
    send_email(
        to=ngo_email,
        subject=f"Crop Loss Report)",
        message_text="testing"
    )


# import os
# import base64
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# from email.mime.application import MIMEApplication
# from google_auth_oauthlib.flow import InstalledAppFlow
# from googleapiclient.discovery import build
# from google.auth.transport.requests import Request
# import pickle

# # Step 1: Define the scopes
# SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# # Step 2: Authenticate
# def get_gmail_service():
#     creds = None
#     if os.path.exists('token.pickle'):
#         with open('token.pickle', 'rb') as token:
#             creds = pickle.load(token)

#     if not creds or not creds.valid:
#         if creds and creds.expired and creds.refresh_token:
#             creds.refresh(Request())
#         else:
#             flow = InstalledAppFlow.from_client_secrets_file(
#                 'cred.json', SCOPES)
#             creds = flow.run_local_server(port=0)

#         with open('token.pickle', 'wb') as token:
#             pickle.dump(creds, token)

#     service = build('gmail', 'v1', credentials=creds)
#     return service

# # Step 3: Create and send message with PDF attachment
# def send_email(to, subject, pdf_path):
#     service = get_gmail_service()

#     # Multipart message
#     message = MIMEMultipart()
#     message['to'] = to
#     message['subject'] = subject

#     # Optional text body
#     body_text = "Please find the attached PDF file."
#     message.attach(MIMEText(body_text, 'plain'))

#     # Attach PDF
#     with open(pdf_path, 'rb') as f:
#         pdf_data = f.read()
#         pdf_attachment = MIMEApplication(pdf_data, _subtype="pdf")
#         pdf_attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(pdf_path))
#         message.attach(pdf_attachment)

#     # Encode message
#     raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
#     body = {'raw': raw}

#     # Send
#     sent_msg = service.users().messages().send(userId='me', body=body).execute()
#     print(f"Message with PDF sent. ID: {sent_msg['id']}")

# Example usage (uncomment to run)
# send_email(
#     to="n.kavya1603@gmail.com",
#     subject="Test Email with PDF",
#     pdf_path="C:/Users/kavya/OneDrive/Desktop/hackathon_googlecloud/hackathon_googlecloud/init_to_winit_Idea Submission Deck _ Agentic AI Day.pdf"
# )
