// Helper to get element by id
function $(id) {
  return document.getElementById(id);
}

// Show / hide modals
function openModal(id) {
  $(id).classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

// ------------ DATA (from backend) -------------
var donors = [];
var requests = [];

// is admin logged in?
var isAdmin = false;

// ------------ LOAD DATA FROM BACKEND ----------
function loadData() {
  // Load donors
  fetch("/api/donors")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      donors = data;
      updateStats();
      showDonors();
    });

  // Load requests
  fetch("/api/requests")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      requests = data;
      updateStats();
      showRequests();
    });
}

// Update the numbers at top
function updateStats() {
  $("stat-donors").textContent = donors.length;
  $("stat-requests").textContent = requests.length;
}

// ------------ SHOW DONORS LIST ----------------
function showDonors() {
  var div = $("donor-list");

  if (donors.length === 0) {
    div.innerHTML = "<p>No donors yet.</p>";
    return;
  }

  var html = "";
  for (var i = 0; i < donors.length; i++) {
    var d = donors[i];
    html +=
      '<div class="list-item">' +
      "<strong>" + d.name + "</strong> (" + d.blood + ") - " + d.city + "<br/>" +
      "Age: " + d.age + ", Gender: " + d.gender + "<br/>" +
      "Contact: " + d.contact + "<br/>" +
      "Last Donation: " + (d.lastDonation || "N/A") + "<br/><br>" +

      // always visible
      '<button class="btn-request-main" data-id="' + d.id + '">Request Blood</button>';

    // ➜ Delete button only for admin
    if (isAdmin) {
      html +=
        ' <button class="btn-delete" data-id="' + d.id + '" ' +
        'style="background:#444; color:white; margin-left:10px;">Delete</button>';
    }

    html += "</div>";
  }

  div.innerHTML = html;
  $("list-section").classList.remove("hidden");

  // Request buttons
  var reqButtons = div.getElementsByClassName("btn-request-main");
  for (var j = 0; j < reqButtons.length; j++) {
    reqButtons[j].onclick = function () {
      var donorId = Number(this.dataset.id);
      openRequestForDonor(donorId);
    };
  }

  // Delete buttons (only exist when isAdmin is true)
  if (isAdmin) {
    var delButtons = div.getElementsByClassName("btn-delete");
    for (var k = 0; k < delButtons.length; k++) {
      delButtons[k].onclick = function () {
        var donorId = Number(this.dataset.id);
        deleteDonor(donorId);
      };
    }
  }
}
// ------------ SHOW REQUESTS LIST --------------

function showRequests() {
  var div = $("request-list");

  if (requests.length === 0) {
    div.innerHTML = "<p>No requests yet.</p>";
    return;
  }

  var html = "";
  for (var i = 0; i < requests.length; i++) {
    var r = requests[i];
    html +=
      '<div class="list-item">' +
      "<strong>For Donor:</strong> " + r.donorName + " (" + r.donorBlood + ")<br/>" +
      "<strong>Requester:</strong> " + r.name + " (" + r.contact + ")<br/>" +
      "Date: " + r.date + "<br/>" +
      "Message: " + (r.message || "-") +
      "</div>";
  }
  div.innerHTML = html;

  // 👉 show the Requests section
  $("requests-section").classList.remove("hidden");
}

// ------------ SUBMIT DONOR FORM ---------------
function submitDonorForm(event) {
  event.preventDefault();

  var name = $("donor-name").value.trim();
  var age = $("donor-age").value.trim();
  var gender = $("donor-gender").value;
  var blood = $("donor-blood").value;
  var contact = $("donor-contact").value.trim();
  var city = $("donor-city").value.trim();
  var lastDonation = $("donor-last").value;

  if (!name || !age || !gender || !blood || !contact || !city) {
    alert("Please fill all required fields.");
    return;
  }

  var newDonor = {
    name: name,
    age: age,
    gender: gender,
    blood: blood,
    contact: contact,
    city: city,
    lastDonation: lastDonation
  };

  fetch("/api/donors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newDonor)
  })
    .then(function (res) { return res.json(); })
    .then(function (saved) {
      donors.push(saved);
      updateStats();
      showDonors();
      $("donor-form").reset();
      closeModal("modal-register");
    });
}

// ------------ SEARCH DONORS -------------------
function searchDonors() {
  var blood = $("search-blood").value;
  var city = $("search-city").value.trim().toLowerCase();
  var name = $("search-name").value.trim().toLowerCase();

  var results = [];
  for (var i = 0; i < donors.length; i++) {
    var d = donors[i];
    var ok = true;

    if (blood && d.blood !== blood) ok = false;
    if (city && d.city.toLowerCase().indexOf(city) === -1) ok = false;
    if (name && d.name.toLowerCase().indexOf(name) === -1) ok = false;

    if (ok) results.push(d);
  }

  var div = $("search-results");
  if (results.length === 0) {
    div.innerHTML = "<p>No donors found.</p>";
    return;
  }

  var html = "";
  for (var j = 0; j < results.length; j++) {
    var d2 = results[j];
    html +=
      '<div class="list-item">' +
      "<strong>" + d2.name + "</strong> (" + d2.blood + ") - " + d2.city + "<br/>" +
      "Contact: " + d2.contact + "<br/>" +
      '<button class="btn-request" data-id="' + d2.id + '">Request Blood</button>' +
      "</div>";
  }
  div.innerHTML = html;

  var btns = div.getElementsByClassName("btn-request");
  for (var k = 0; k < btns.length; k++) {
    btns[k].addEventListener("click", function () {
      var id = Number(this.getAttribute("data-id"));
      openRequestForDonor(id);
    });
  }
}

// ------------ OPEN REQUEST MODAL --------------
function openRequestForDonor(donorId) {
  var donor = null;
  for (var i = 0; i < donors.length; i++) {
    if (donors[i].id === donorId) {
      donor = donors[i];
      break;
    }
  }
  if (!donor) return;

  $("request-donor-id").value = donor.id;
  $("request-donor-info").textContent =
    "Requesting blood from " + donor.name + " (" + donor.blood + ") - " + donor.city;

  $("req-name").value = "";
  $("req-contact").value = "";
  $("req-date").value = "";
  $("req-message").value = "";

  openModal("modal-request");
}

// ------------ SUBMIT REQUEST FORM -------------
function submitRequestForm(event) {
  event.preventDefault();

  var donorId = Number($("request-donor-id").value);
  var name = $("req-name").value.trim();
  var contact = $("req-contact").value.trim();
  var date = $("req-date").value;
  var message = $("req-message").value.trim();

  if (!name || !contact || !date) {
    alert("Please fill your name, contact and date.");
    return;
  }

  var donor = null;
  for (var i = 0; i < donors.length; i++) {
    if (donors[i].id === donorId) {
      donor = donors[i];
      break;
    }
  }
  if (!donor) {
    alert("Donor not found.");
    return;
  }

  var newReq = {
    donorId: donorId,
    donorName: donor.name,
    donorBlood: donor.blood,
    name: name,
    contact: contact,
    date: date,
    message: message
  };

  fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newReq)
  })
    .then(function (res) { return res.json(); })
    .then(function (saved) {
      requests.push(saved);
      updateStats();
      showRequests();
      closeModal("modal-request");
    });
}

// ------------ ADMIN (simple) ------------------
function adminLogin(event) {
  event.preventDefault();
  var pwd = $("admin-password").value;
  if (pwd === "admin123") {
    isAdmin = true;  // ✅ now admin is logged in
    $("admin-panel").classList.remove("hidden");
    $("admin-password").value = "";
    showDonors();    // refresh donor list to show delete buttons
  } else {
    alert("Wrong password");
  }
}
function adminLogout() {
  isAdmin = false;   // ✅ admin logged out
  $("admin-panel").classList.add("hidden");
  showDonors();      // refresh donor list to HIDE delete buttons
}

// ------------ FILTER DONOR LIST ----------------
function filterDonors() {
  var name = $("filter-name").value.trim().toLowerCase();
  var blood = $("filter-blood").value;
  var city = $("filter-city").value.trim().toLowerCase();

  var results = [];
  for (var i = 0; i < donors.length; i++) {
    var d = donors[i];
    var ok = true;

    if (name && d.name.toLowerCase().indexOf(name) === -1) ok = false;
    if (blood && d.blood !== blood) ok = false;
    if (city && d.city.toLowerCase().indexOf(city) === -1) ok = false;

    if (ok) results.push(d);
  }

  var div = $("donor-list");
  if (results.length === 0) {
    div.innerHTML = "<p>No donors match the filter.</p>";
    return;
  }

  var html = "";
  for (var j = 0; j < results.length; j++) {
    var d2 = results[j];
    html +=
      '<div class="list-item">' +
      "<strong>" + d2.name + "</strong> (" + d2.blood + ") - " + d2.city +
      "</div>";
  }
  div.innerHTML = html;
}

function clearFilter() {
  $("filter-name").value = "";
  $("filter-blood").value = "";
  $("filter-city").value = "";
  showDonors();
}
function deleteDonor(id) {
  if (!isAdmin) {
    alert("Only admin can delete donors.");
    return;
  }

  if (!confirm("Are you sure you want to delete this donor?")) {
    return;
  }

  fetch("/api/donors/" + id, {
    method: "DELETE"
  })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Server returned " + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      // remove from local array
      donors = donors.filter(function (d) {
        return d.id !== id;
      });
      updateStats();
      showDonors();
      alert("Donor deleted");
    })
    .catch(function (err) {
      console.log("Delete error:", err);
      alert("Error deleting donor.");
    });
}
// ---------- EXPORT DONORS CSV ----------
function exportCSV() {
  // simple: open the backend URL to download file
  window.location.href = "/api/donors/export";
}

// ---------- SEED SAMPLE DATA ----------
function seedSampleData() {
  alert("Seed Sample Data clicked! (No sample donors defined yet.)");
}
//------------ MAIN: RUN WHEN PAGE LOADS -------
window.addEventListener("DOMContentLoaded", function () {
  loadData();

  $("open-register").addEventListener("click", function () { openModal("modal-register"); });
  $("cancel-register").addEventListener("click", function () { closeModal("modal-register"); });

  $("open-search").addEventListener("click", function () { openModal("modal-search"); });
  $("btn-close-search").addEventListener("click", function () { closeModal("modal-search"); });

  $("open-admin").addEventListener("click", function () { openModal("modal-admin"); });
  $("close-admin-login").addEventListener("click", function () { closeModal("modal-admin"); });

  $("cancel-request").addEventListener("click", function () { closeModal("modal-request"); });

  $("donor-form").addEventListener("submit", submitDonorForm);
  $("request-form").addEventListener("submit", submitRequestForm);
  $("admin-login-form").addEventListener("submit", adminLogin);

  $("btn-search").addEventListener("click", searchDonors);
  $("btn-filter").addEventListener("click", filterDonors);
  $("btn-clear-filter").addEventListener("click", clearFilter);

  $("admin-logout").addEventListener("click", adminLogout);
  $("export-csv").addEventListener("click", exportCSV);
  $("seed-sample").addEventListener("click", seedSampleData);
});
