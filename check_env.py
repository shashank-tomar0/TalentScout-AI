import sys
import platform
import struct

print(f"Python version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Architecture: {struct.calcsize('P') * 8}-bit")

try:
    import torch
    print("Torch imported successfully")
except Exception as e:
    print(f"Torch import failed: {e}")

try:
    import uvicorn
    print("Uvicorn imported successfully")
except Exception as e:
    print(f"Uvicorn import failed: {e}")
