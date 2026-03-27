import asyncio
import os
import pdfplumber
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Let's find Texmo-1.pdf
pdf_path = os.path.join(BASE_DIR, "Texmo-1.pdf")
if not os.path.exists(pdf_path):
    # Search for any PDF
    pass

full_text = ""
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        full_text += (page.extract_text() or "") + "\n"

print(full_text.lower())
