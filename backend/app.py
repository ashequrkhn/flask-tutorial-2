from flask import Flask, request, jsonify, Blueprint, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "instance", "data.db")


app = Flask(__name__)
auth_bp = Blueprint('auth', __name__)
# Enable CORS for the app
# This allows the frontend to communicate with the backend without CORS issues
CORS(app, supports_credentials=True)

app.secret_key = "supersecret"


app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}" # Example DB URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    suburban_area = db.Column(db.String(100), nullable=True)
    council_area = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<Location {self.latitude}, {self.longitude}, {self.suburban_area}, {self.council_area}>'

### Routes ###

### Authentication Routes ###
@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and user.password == password:
        session['user'] = user.email
        return jsonify({"message": "Logged in"}), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/auth/me', methods=['GET'])
def get_current_user():
    user_email = session.get('user')
    if user_email:
        return jsonify({"loggedIn": True, "email": user_email})
    return jsonify({"loggedIn": False}), 401


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logged out"}), 200


app.register_blueprint(auth_bp)

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

    with app.app_context():
        print("starting querying users")
        users = User.query.all()
        print("All users:", users)

    app.run(debug=True)
