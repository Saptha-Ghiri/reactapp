# import serial
# import time
# import firebase_admin
# from firebase_admin import credentials
# from firebase_admin import db
# import json

# Firebase setup - using your specific Firebase project
cred = credentials.Certificate('predict-sih-firebase-credentials.json')  # You'll need to generate this from Firebase console
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://predict-sih-default-rtdb.firebaseio.com'  # Your actual database URL
})

# # Reference to your database
# ref = db.reference('foodMonitor')

# # Arduino Serial setup
# try:
#     arduino = serial.Serial('/dev/ttyUSB0', 115200, timeout=1)  # Change port as needed (e.g., 'COM3' on Windows)
#     print("Connected to Arduino")
#     time.sleep(2)  # Allow time for connection to stabilize
# except Exception as e:
#     print(f"Error connecting to Arduino: {e}")
#     exit(1)

# def read_from_arduino():
#     """Read data from Arduino and parse it"""
#     if arduino.in_waiting > 0:
#         try:
#             line = arduino.readline().decode('utf-8').strip()
            
#             # Parse the readings
#             sensor_data = {}
            
#             if "Temperature:" in line:
#                 temp_val = line.split("Temperature:")[1].split("°C")[0].strip()
#                 sensor_data['temperature'] = float(temp_val)
#             elif "Humidity:" in line:
#                 hum_val = line.split("Humidity:")[1].split("%")[0].strip()
#                 sensor_data['humidity'] = float(hum_val)
#             elif "Gas Sensor Value:" in line:
#                 gas_val = line.split("Gas Sensor Value:")[1].strip()
#                 sensor_data['gasValue'] = int(gas_val)
#             elif "Distance:" in line and "Not Detected" not in line:
#                 dist_val = line.split("Distance:")[1].split("cm")[0].strip()
#                 sensor_data['distance'] = float(dist_val)
#             elif "❌ No Food Inside" in line:
#                 sensor_data['foodPresent'] = False
#             elif "❌ WARNING: FOOD IS SPOILED" in line:
#                 sensor_data['foodSpoiled'] = True
#             elif "✅ FOOD IS SAFE TO USE" in line:
#                 sensor_data['foodPresent'] = True
#                 sensor_data['foodSpoiled'] = False
                
#             return sensor_data
#         except Exception as e:
#             print(f"Error parsing Arduino data: {e}")
#     return None

# def send_to_arduino(command):
#     """Send command to Arduino"""
#     try:
#         arduino.write(command.encode())
#         print(f"Sent command: {command}")
#         return True
#     except Exception as e:
#         print(f"Error sending to Arduino: {e}")
#         return False

# def check_firebase_commands():
#     """Check if there are any commands in Firebase to send to Arduino"""
#     try:
#         command_ref = db.reference('foodMonitor/commands')
#         command_data = command_ref.get()
        
#         if command_data and 'servo' in command_data:
#             if command_data['servo'] == 'open':
#                 send_to_arduino('O')
#                 # Reset the command after execution
#                 command_ref.update({'servo': 'none'})
#             elif command_data['servo'] == 'close':
#                 send_to_arduino('C')
#                 # Reset the command after execution
#                 command_ref.update({'servo': 'none'})
        
#     except Exception as e:
#         print(f"Error checking Firebase commands: {e}")

# def update_firebase(sensor_data):
#     """Update Firebase with sensor data"""
#     if sensor_data:
#         try:
#             # Only update the fields that are present in sensor_data
#             ref.update(sensor_data)
#             print(f"Updated Firebase: {sensor_data}")
#         except Exception as e:
#             print(f"Error updating Firebase: {e}")

# def main():
#     last_update_time = 0
#     update_interval = 2  # seconds
    
#     print("Starting monitoring loop...")
    
#     while True:
#         # Process any incoming data from Arduino
#         sensor_data = {}
        
#         # Read multiple lines to get complete data set
#         for _ in range(10):  # Try to read multiple lines to get complete data
#             data = read_from_arduino()
#             if data:
#                 sensor_data.update(data)
#             time.sleep(0.1)
        
#         # Check if it's time to update Firebase
#         current_time = time.time()
#         if current_time - last_update_time >= update_interval and sensor_data:
#             update_firebase(sensor_data)
#             last_update_time = current_time
        
#         # Check for commands from Firebase
#         check_firebase_commands()
        
#         time.sleep(0.5)  # Small delay to prevent CPU overuse

# if __name__ == "__main__":
#     try:
#         main()
#     except KeyboardInterrupt:
#         print("Program terminated by user")
#     except Exception as e:
#         print(f"Unexpected error: {e}")
#     finally:
#         if 'arduino' in locals() and arduino.is_open:
#             arduino.close()
#             print("Arduino connection closed")






import firebase_admin
from firebase_admin import credentials, db
import serial
import time
import json

# Initialize Firebase with your credentials
# Create a service account key file from Firebase console and download it
cred = credentials.Certificate("pass.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://predict-sih-default-rtdb.firebaseio.com'
})

# Serial configuration for Arduino
SERIAL_PORT = 'COM3'  # Change to your Arduino's port (e.g., '/dev/ttyUSB0' on Linux)
BAUD_RATE = 9600

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
        
        # Wait for and read response
        time.sleep(0.5)  # Give Arduino time to respond
        if ser.in_waiting:
            response = ser.readline().decode().strip()
            print(f"Arduino response: {response}")
        
        return True
    except Exception as e:
        print(f"Error sending command: {e}")
        return False

def listen_for_status_changes(ser):
    """Listen for changes to motor status in Firebase and send to Arduino"""
    # Reference to motorStatus in the Realtime Database
    motor_ref = db.reference('motorStatus')
    last_status = None
    
    def handle_status_change(event):
        nonlocal last_status
        
        # Get the data from the event
        data = event.data
        if not data:
            print("No data received")
            return
            
        # Extract the status
        status = data.get('status')
        if not status:
            print("No status found in data")
            return
            
        # If status is the same as last time, do nothing
        if status == last_status:
            return
            
        print(f"Motor status changed to: {status}")
        last_status = status
        
        # Send appropriate command to Arduino
        command = 'O' if status == 'open' else 'C'
        send_command(ser, command)
        
    # Set up the listener for changes
    motor_ref.listen(handle_status_change)
    print("Listening for motor status changes...")

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
        print("Monitoring Firebase for status changes. Press Ctrl+C to exit.")
        while True:
            time.sleep(1)
    
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















import serial
import json
import time
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import threading

# Firebase configuration
cred = credentials.Certificate('predict-sih-firebase-credentials.json')  # You'll need to generate this from Firebase console
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://predict-sih-default-rtdb.firebaseio.com'  # Your actual database URL
})

# Serial configuration
SERIAL_PORT = '/dev/ttyUSB0'  # Change to your Arduino's serial port (e.g., 'COM3' on Windows)
BAUD_RATE = 115200

# Reference to your Firebase database
ref = db.reference('arduino_data')
command_ref = db.reference('arduino_control/servo_command')

def read_serial_data():
    """Read and process data from Arduino"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=5)
        print(f"Connected to Arduino on {SERIAL_PORT}")
        
        while True:
            try:
                # Read a line from the serial port
                line = ser.readline().decode('utf-8').strip()
                
                if line:
                    # Parse the JSON data from Arduino
                    try:
                        data = json.loads(line)
                        print(f"Received data: {data}")
                        
                        # Update Firebase with the received data
                        update_firebase(data)
                    except json.JSONDecodeError as e:
                        print(f"JSON parsing error: {e}")
                        print(f"Received invalid data: {line}")
            except Exception as e:
                print(f"Error reading from serial: {e}")
                time.sleep(1)
    except serial.SerialException as e:
        print(f"Failed to connect to Arduino: {e}")
        time.sleep(5)  # Wait before retrying
        read_serial_data()  # Recursively retry connection

def update_firebase(data):
    """Update Firebase with the sensor data"""
    try:
        # Add timestamp
        data['timestamp'] = {'.sv': 'timestamp'}
        
        # Push data to Firebase
        ref.push().set(data)
        print("Data uploaded to Firebase successfully")
    except Exception as e:
        print(f"Firebase update error: {e}")

def listen_for_commands():
    """Listen for commands from Firebase and send to Arduino"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=5)
        
        def on_command_change(event):
            """Firebase callback when servo command is updated"""
            try:
                command = event.data
                if command:
                    print(f"Received command from Firebase: {command}")
                    
                    # Send the command to Arduino
                    if command == "open":
                        ser.write(b'O')
                        print("Sent OPEN command to Arduino")
                    elif command == "close":
                        ser.write(b'C')
                        print("Sent CLOSE command to Arduino")
                    
                    # Reset the command in Firebase
                    command_ref.set("")
            except Exception as e:
                print(f"Error processing command: {e}")
        
        # Set up the listener for command changes
        command_ref.listen(on_command_change)
        
    except serial.SerialException as e:
        print(f"Failed to connect to Arduino for commands: {e}")
        time.sleep(5)
        listen_for_commands()  # Retry

if __name__ == "__main__":
    # Start command listener in a separate thread
    command_thread = threading.Thread(target=listen_for_commands)
    command_thread.daemon = True
    command_thread.start()
    
    # Start reading serial data in the main thread
    read_serial_data()