# Vercel's Python runtime looks for a WSGI `app` in each file under api/.
# app.py stays at the project root so its template/static paths (derived from
# Flask(__name__)'s location) are unaffected by living under a subfolder.
from app import app
