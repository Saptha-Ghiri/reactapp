import csv
import firebase_admin
from firebase_admin import credentials, firestore
import argparse
from datetime import datetime

def import_csv_to_firestore(csv_file_path):
    """
    Import recipe data directly from a CSV file to Firestore.
    
    Args:
        csv_file_path (str): Path to the CSV file containing recipe data
    """
    # Initialize Firebase with admin privileges
    cred = credentials.Certificate('pass.json')
    firebase_admin.initialize_app(cred)
    
    # Get Firestore client
    db = firestore.client()
    
    # Reference to the recipes collection
    recipes_ref = db.collection('recipes')
    
    # Import statistics
    imported_count = 0
    error_count = 0
    
    print(f"Reading CSV file: {csv_file_path}")
    
    # Open and read the CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        # Process each row in the CSV
        for row in csv_reader:
            try:
                # Create a new recipe document
                recipe_data = {
                    'title': row.get('title', ''),
                    'course': row.get('course', ''),
                    'cuisine': row.get('cuisine', ''),
                    'description': row.get('description', ''),
                    'diet': row.get('diet', ''),
                    'image_url': row.get('image_url', ''),
                    'ingredients': row.get('ingredients', ''),
                    'instructions': row.get('instructions', ''),
                    'prep_time': row.get('prep_time', '')
                }
                
                # Handle the ID field - note we're not using it as document ID anymore
                if 'id' in row and row['id']:
                    try:
                        recipe_data['id'] = int(row['id'])
                    except ValueError:
                        print(f"Warning: Invalid ID format for row with title '{row.get('title', 'Untitled')}'. Skipping ID field.")
                
                # Set the creation timestamp to current time
                recipe_data['createdAt'] = firestore.SERVER_TIMESTAMP
                
                # Create searchable keywords for better searching
                searchable_text = ' '.join([
                    recipe_data.get('title', ''),
                    recipe_data.get('ingredients', ''),
                    recipe_data.get('description', ''),
                    recipe_data.get('cuisine', ''),
                    recipe_data.get('course', ''),
                    recipe_data.get('diet', '')
                ]).lower()
                
                # Extract keywords (remove common words, keep words longer than 2 chars)
                common_words = {'and', 'the', 'for', 'with', 'from', 'this', 'that', 'not', 'are', 'is'}
                searchable_keywords = [
                    word for word in searchable_text.split() 
                    if len(word) > 2 and word not in common_words
                ]
                
                # Add searchable keywords to recipe data
                recipe_data['searchableKeywords'] = searchable_keywords
                
                # Add the recipe to Firestore with auto-generated ID
                doc_ref = recipes_ref.add(recipe_data)
                
                imported_count += 1
                print(f"Imported recipe: {recipe_data.get('title') or 'Untitled'} (ID: {doc_ref[1].id})")
                
            except Exception as e:
                error_count += 1
                print(f"Error importing row {imported_count + error_count}: {str(e)}")
    
    # Record the import operation
    try:
        db.collection('import_logs').add({
            'timestamp': firestore.SERVER_TIMESTAMP,
            'file_path': csv_file_path,
            'records_imported': imported_count,
            'errors': error_count
        })
        print(f"Import log saved to Firestore.")
    except Exception as e:
        print(f"Warning: Could not save import log: {str(e)}")
    
    print(f"\nImport completed. {imported_count} recipes imported successfully. {error_count} errors encountered.")

def check_csv_format(csv_file_path):
    """
    Check if the CSV file has the expected headers.
    
    Args:
        csv_file_path (str): Path to the CSV file
    
    Returns:
        bool: True if the CSV has valid headers, False otherwise
    """
    expected_headers = ['title','image_url', 'description', 
                        'cuisine', 'course', 'diet', 'prep_time', 'ingredients', 'instructions']
    
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.reader(csv_file)
        headers = next(csv_reader, None)
        
        if not headers:
            print("Error: CSV file is empty")
            return False
        
        # Check if all expected headers are present
        missing_headers = [h for h in expected_headers if h not in headers]
        if missing_headers:
            print(f"Warning: Missing expected headers: {', '.join(missing_headers)}")
            print(f"Found headers: {', '.join(headers)}")
            response = input("Do you want to continue anyway? (y/n): ")
            return response.lower() == 'y'
        
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import recipes from CSV directly to Firestore')
    parser.add_argument('csv_file', help='Path to the CSV file containing recipe data')
    args = parser.parse_args()
    
    # Validate CSV format
    if check_csv_format(args.csv_file):
        import_csv_to_firestore(args.csv_file)
    else:
        print("Import canceled due to CSV format issues.")