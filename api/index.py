import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.main import app

# Vercel serverless function entrypoint
