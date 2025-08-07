from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)  # allow cross-origin requests from React frontend
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///coordinates.db'  # Example DB URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    suburban_area = db.Column(db.String(100), nullable=True)
    council_area = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<Location {self.latitude}, {self.longitude}, {self.suburban_area}, {self.council_area}>'

@app.route("/api/coordinates", methods=["POST"])
def receive_coordinates():
    data = request.get_json()
    lat = data.get("latitude")
    lon = data.get("longitude")

    print(f"Received coordinates: {lat}, {lon}")

    # Here you can add DB saving, reverse geocoding, whatever you want

    return jsonify({
        "status": "success",
        "message": "Coordinates received",
        "data": {
            "latitude": lat,
            "longitude": lon
        }
    })

if __name__ == "__main__":
    app.run(debug=True)
