from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = FastAPI()

class MailAnalizi(BaseModel):
    kategori: str
    oncelik: str
    ozet: str

class Mail(BaseModel):
    icerik: str    


@app.post("/mail-analiz")
def mail_analiz_et(mail: Mail):
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"Bu e-postayı analiz et: {mail.icerik}",
        config={
            "response_mime_type": "application/json",
            "response_schema": MailAnalizi,
        }
    )
    return response.parsed
    