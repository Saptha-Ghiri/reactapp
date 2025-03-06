import firebase_admin
from firebase_admin import credentials, firestore
import json
import time
from google.cloud.firestore_v1.base_document import DocumentSnapshot

# 🔹 Initialize Firestore
cred = credentials.Certificate("pass.json")  # Ensure your Firestore credentials file is correct
firebase_admin.initialize_app(cred)

db = firestore.client()

# 🔹 Test Firestore connection
try:
    db.collection("recipes").document("test").get()
    print("✅ Firestore connection successful!")
except Exception as e:
    print("❌ Firestore connection failed:", e)
    exit()

# 🔹 Helper function to convert Firestore timestamps to JSON serializable format
def convert_firestore_data(data):
    """ Convert Firestore document data to JSON serializable format """
    for key, value in data.items():
        if isinstance(value, DocumentSnapshot):
            data[key] = value.to_dict()  # Convert nested documents
        elif hasattr(value, "isoformat"):  # Convert Firestore timestamps
            data[key] = value.isoformat()
    return data

# 🔹 Fetch limited recipes (Adjust limit if needed)
recipes_ref = db.collection("recipes")  # Fetch up to 500 recipes
docs = recipes_ref.stream()

recipes = []
c = 1
start_time = time.time()
TIMEOUT = 30  # Stop fetching after 30 seconds to prevent freezing

for doc in docs:
    if time.time() - start_time > TIMEOUT:
        print("⏳ Timeout reached! Stopping data fetch.")
        break

    if c % 100 == 0:
        print(c, " recipes added")

    data = doc.to_dict()
    data["id"] = doc.id
    recipes.append(convert_firestore_data(data))
    c += 1

# 🔹 Save to JSON file
with open("recipes.json", "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ Recipes successfully exported to recipes.json")
