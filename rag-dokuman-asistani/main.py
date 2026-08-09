from pypdf import PdfReader

reader = PdfReader("test_dokuman.pdf")

tam_metin = ""
for sayfa in reader.pages:
    tam_metin += sayfa.extract_text()

print(f"Toplam karakter sayısı: {len(tam_metin)}")
print(tam_metin[:500])  # ilk 500 karakteri göster

from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # her parça yaklaşık 500 karakter
    chunk_overlap=50     # parçalar arasında 50 karakterlik örtüşme
)

parcalar = splitter.split_text(tam_metin)

print(f"Toplam parça sayısı: {len(parcalar)}")
print(parcalar[0])  # ilk parçayı göster

import chromadb

client = chromadb.Client()
koleksiyon = client.create_collection(name="pdf_koleksiyon")

# Her parçayı benzersiz bir ID ile ekle
id_listesi = [f"parca_{i}" for i in range(len(parcalar))]

koleksiyon.add(
    documents=parcalar,
    ids=id_listesi
)

print(f"{len(parcalar)} parça ChromaDB'ye eklendi.")

# Şimdi PDF hakkında bir soru sor
soru = "Bu programda kaç hafta var?"

sonuclar = koleksiyon.query(
    query_texts=[soru],
    n_results=3
)

print("\nEn alakalı parçalar:")
for i, parca in enumerate(sonuclar["documents"][0]):
    print(f"\n--- Parça {i+1} ---")
    print(parca)

from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
llm_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Bulunan parçaları birleştir
baglam = "\n\n".join(sonuclar["documents"][0])

prompt = f"""Aşağıdaki bilgilere dayanarak soruyu cevapla. Sadece verilen bilgileri kullan, kendi bilgini ekleme.

BİLGİLER:
{baglam}

SORU: {soru}

CEVAP:"""

response = llm_client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "user", "content": prompt}
    ]
)

print("\n=== LLM CEVABI ===")
print(response.choices[0].message.content)