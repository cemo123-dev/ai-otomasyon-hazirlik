import requests

veri = {
    "icerik": "Merhaba, geçen hafta aldığım ürün bozuk geldi, acilen iade istiyorum. Bu ne biçim hizmet!"
}

try:
    response = requests.post("http://127.0.0.1:8000/mail-analiz", json=veri)
    response.raise_for_status()  # Raise an error for bad responses (4xx and 5xx)
    data = response.json()
    print("Data retrieved successfully:", data)
except requests.RequestException as e:
    print("Error retrieving data:", e)