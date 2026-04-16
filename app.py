# app.py
# Very simple Flask backend for Blood Donor Management System

from flask import Flask, jsonify, request, render_template, Response

app = Flask(__name__)

# ------------------------------
# "Database" in memory (just Python lists)
# When you stop the server, data will be lost.
# ------------------------------
donors = []        # list of all donors
requests_list = [] # list of all blood requests

# Simple ID numbers for donors and requests
next_donor_id = 1
next_request_id = 1


# ------------------------------
# Home page (shows your HTML)
# ------------------------------
@app.route("/")
def index():
    # This will open templates/index.html
    return render_template("index.html")


# ------------------------------
# Donors API
# GET  /api/donors  -> get all donors
# POST /api/donors  -> add a new donor
# ------------------------------
@app.route("/api/donors", methods=["GET", "POST"])
def api_donors():
    global next_donor_id   # we want to change this global variable

    if request.method == "GET":
        # Return all donors as JSON
        return jsonify(donors)

    # If method is POST -> we want to add a new donor
    data = request.get_json()

    if data is None:
        return jsonify({"error": "No data sent"}), 400

    # Create a new donor dictionary
    new_donor = {
        "id": next_donor_id,
        "name": data.get("name", ""),
        "age": data.get("age", ""),
        "gender": data.get("gender", ""),
        "blood": data.get("blood", ""),
        "contact": data.get("contact", ""),
        "city": data.get("city", ""),
        "lastDonation": data.get("lastDonation", "")
    }

    # Increase ID for next donor
    next_donor_id += 1

    # Add this donor to our list
    donors.append(new_donor)

    # Return the new donor as JSON with status 201 (created)
    return jsonify(new_donor), 201
@app.route("/api/donors/<int:donor_id>", methods=["DELETE"])
def delete_donor(donor_id):
    global donors
    # keep all donors except the one with this id
    donors = [d for d in donors if d["id"] != donor_id]
    return jsonify({"message": "deleted", "id": donor_id})

# ------------------------------
# Requests API
# GET  /api/requests  -> get all requests
# POST /api/requests  -> add a new request
# ------------------------------
@app.route("/api/requests", methods=["GET", "POST"])
def api_requests():
    global next_request_id

    if request.method == "GET":
        return jsonify(requests_list)

    data = request.get_json()
    if data is None:
        return jsonify({"error": "No data sent"}), 400

    new_req = {
        "id": next_request_id,
        "donorId": data.get("donorId"),
        "donorName": data.get("donorName", ""),
        "donorBlood": data.get("donorBlood", ""),
        "name": data.get("name", ""),
        "contact": data.get("contact", ""),
        "date": data.get("date", ""),
        "message": data.get("message", "")
    }

    next_request_id += 1

    requests_list.append(new_req)

    return jsonify(new_req), 201


# ------------------------------
# Export donors as CSV file
# GET /api/donors/export
# ------------------------------
@app.route("/api/donors/export")
def export_donors_csv():
    # Make CSV text in memory (string)
    # Header row:
    csv_text = "id,name,age,gender,blood,contact,city,lastDonation\n"

    # Add each donor as a line
    for d in donors:
        line = (
            f"{d['id']},"
            f"{d['name']},"
            f"{d['age']},"
            f"{d['gender']},"
            f"{d['blood']},"
            f"{d['contact']},"
            f"{d['city']},"
            f"{d['lastDonation']}\n"
        )
        csv_text += line

    # Send it as a file download
    return Response(
        csv_text,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=donors.csv"}
    )


# ------------------------------
# Run the app
# ------------------------------
if __name__ == "__main__":
    # debug=True is useful during development
    app.run(host="127.0.0.1", port=5001, debug=True)