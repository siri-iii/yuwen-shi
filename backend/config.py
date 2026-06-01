import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")
UPLOADS_DIR = os.path.join(BASE_DIR, "backend", "uploads")

PATTERNS_FILE = os.path.join(DATA_DIR, "patterns.json")
ARTIFACTS_FILE = os.path.join(DATA_DIR, "artifacts.json")
DEMO_IMAGES_FILE = os.path.join(DATA_DIR, "demo_images.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)
