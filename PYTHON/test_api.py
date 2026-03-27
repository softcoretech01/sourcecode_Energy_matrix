import requests
import os
from dotenv import load_dotenv

load_dotenv()
BE_URL = "http://localhost:8000"

# 1. Login to get token
# Username might be 'email' or 'username' depending on the schema
login_data = {"username": "admin", "password": "Password@123"} 
# Or if it uses email
# login_data = {"email": "admin@softcore.com", "password": "Password@123"}

r = requests.post(f"{BE_URL}/api/auth/login", json=login_data)
if r.status_code == 200:
    token = r.json().get("access_token")
    print(f"Token obtained: {token[:10]}...")
    
    # 2. Call active-posted endpoint
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BE_URL}/api/windmills/active-posted", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Data: {r.json()}")
else:
    print(f"Login failed: {r.status_code} {r.text}")
