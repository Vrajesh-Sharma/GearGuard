import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from routes.equipment import equipment_bp
from routes.teams import teams_bp
from routes.requests import requests_bp
from routes.dashboard import dashboard_bp

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "*")}})

app.register_blueprint(equipment_bp)
app.register_blueprint(teams_bp)
app.register_blueprint(requests_bp)
app.register_blueprint(dashboard_bp)

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
