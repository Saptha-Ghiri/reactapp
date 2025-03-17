import firebase_admin
from firebase_admin import credentials, db
import serial
import time
import json

# Initialize Firebase with your credentials
cred = credentials.Certificate("pass.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://predict-sih-default-rtdb.firebaseio.com'
})

# Serial configuration for Arduino
SERIAL_PORT = 'COM12'  # Change to your Arduino's port
BAUD_RATE = 115200     # Updated to match Arduino's baud rate

def setup_serial():
    """Establish serial connection with Arduino"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"Connected to Arduino on {SERIAL_PORT}")
        # Allow time for serial connection to establish
        time.sleep(2)
        return ser
    except serial.SerialException as e:
        print(f"Failed to connect to Arduino: {e}")
        return None

def send_command(ser, command):
    """Send a command to Arduino and get response"""
    if not ser:
        print("Serial connection not available")
        return False
    
    try:
        # Send the command
        ser.write(command.encode())
        print(f"Sent command: {command}")
        return True
    except Exception as e:
        print(f"Error sending command: {e}")
        return False

def listen_for_status_changes(ser):
    """Listen for changes to motor status in Firebase and send to Arduino"""
    # Reference to motorStatus in the Realtime Database
    motor_ref = db.reference('/adddelete/motorStatus')
    last_status = None
    
    def handle_status_change(event):
        nonlocal last_status
        
        try:
            # Get the data from the event
            data = event.data
            print(f"Received data: {data}")
            
            # Handle different data formats
            status = None
            
            if isinstance(data, str):
                # If data is just a string
                status = data
            elif isinstance(data, dict) and 'status' in data:
                # If data is a dictionary with status key
                status = data['status']
            elif data is None:
                print("No data received")
                return
            else:
                print(f"Unrecognized data format: {type(data)}")
                return
                
            print(f"Extracted status: {status}")
            
            # If status is the same as last time, do nothing
            if status == last_status:
                return
                
            print(f"Motor status changed to: {status}")
            last_status = status
            
            # Send appropriate command to Arduino
            command = 'O' if status == 'open' else 'C'
            send_command(ser, command)
            
        except Exception as e:
            print(f"Error handling status change: {e}")
    
    # Set up the listener for changes
    motor_ref.listen(handle_status_change)
    print("Listening for motor status changes...")

def read_and_update_sensor_data(ser):
    """Read sensor data from Arduino and update Firebase"""
    # Reference to sensorData in the Realtime Database
    sensor_ref = db.reference('/adddelete')

    
    try:
        if ser.in_waiting:
            data_str = ser.readline().decode().strip()
            
            try:
                # Parse the JSON data from Arduino
                data = json.loads(data_str)
                print(f"Received sensor data: {data}")
                
                # Update Firebase with the sensor data
                sensor_ref.update(data)
                print("Firebase updated with sensor data")
                
                # Additional check for food conditions (optional)
                if 'FoodSpoiled' in data and data['FoodSpoiled'] == True:
                    alert_ref = db.reference('/adddelete')
                    alert_ref.push({
                        'type': 'Food Spoilage Alert',
                        'message': 'Food may be spoiled! Check immediately.',
                        'timestamp': {'.sv': 'timestamp'}
                    })
                    print("Spoilage alert sent to Firebase")
                    
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON data: {e}")
                print(f"Raw data received: {data_str}")
                
                
    except Exception as e:
        print(f"Error reading/updating sensor data: {e}")

def main():
    # Connect to Arduino
    ser = setup_serial()
    
    if not ser:
        print("Failed to connect to Arduino. Exiting.")
        return
    
    try:
        # Start listening for changes in Firebase
        listen_for_status_changes(ser)
        
        # Keep the script running
        print("Monitoring Firebase for status changes and reading sensor data. Press Ctrl+C to exit.")
        while True:
            # Check for and update sensor data
            read_and_update_sensor_data(ser)
            # Small delay to prevent CPU overuse
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\nProgram terminated by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the serial connection
        if ser:
            ser.close()
            print("Serial connection closed")

if __name__ == "__main__":
    main()