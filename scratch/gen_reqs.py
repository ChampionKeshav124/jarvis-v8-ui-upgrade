import subprocess
import os

try:
    print("Generating requirements.txt...")
    reqs = subprocess.check_output(['pip', 'freeze']).decode('utf-8')
    with open('requirements.txt', 'w', encoding='utf-8') as f:
        f.write(reqs)
    print("Optimization complete: requirements.txt is now set to UTF-8 and populated.")
except Exception as e:
    print(f"Error synchronization: {e}")
