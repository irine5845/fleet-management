document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  // Toggle between Login and Sign Up
  if (showSignup && showLogin) {
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("d-none");
      signupForm.classList.remove("d-none");
    });

    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupForm.classList.add("d-none");
      loginForm.classList.remove("d-none");
    });
  }

  // ---------- SIGNUP ----------
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

      const users = JSON.parse(localStorage.getItem("users") || "[]");

      if (users.find(u => u.email === email)) {
        alert("This email is already registered. Please log in.");
        return;
      }

      users.push({ name, email, password });
      localStorage.setItem("users", JSON.stringify(users));
      alert("Account created successfully! You can now log in.");
      signupForm.reset();
      signupForm.classList.add("d-none");
      loginForm.classList.remove("d-none");
    });
  }

  // ---------- LOGIN ----------
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      if (email === "admin@fleet.com" && password === "admin123") {
        localStorage.setItem("role", "admin");
        window.location.href = "admin_dashboard.html";
        return;
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const found = users.find(u => u.email === email && u.password === password);

      if (!found) {
        alert("Invalid credentials. Please try again or sign up.");
        return;
      }

      localStorage.setItem("role", "employee");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", found.name);
      window.location.href = "employee_dashboard.html";
    });
  }

  // ---------- LOGOUT ----------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      window.location.href = "index.html";
    });
  }

  // ---------- EMPLOYEE DASHBOARD ----------
  if (window.location.pathname.includes("employee_dashboard.html")) {
    renderVehicles();
    renderMyBookings();
  }

  // ---------- ADMIN DASHBOARD ----------
  if (window.location.pathname.includes("admin_dashboard.html")) {
    renderRequests();
    renderSentEmails();
  }
});

// ---------- VEHICLE DATA ----------
const vehicles = [
  { id: 1, name: "Toyota Hilux", status: "available" },
  { id: 2, name: "Nissan Patrol", status: "available" },
  { id: 3, name: "Isuzu D-Max", status: "available" },
  { id: 4, name: "Ford Ranger", status: "available" },
];

// ---------- EMPLOYEE ----------
function renderVehicles() {
  const container = document.getElementById("vehicleList");
  container.innerHTML = "";
  vehicles.forEach((v) => {
    const card = document.createElement("div");
    card.className = "col-md-3";
    card.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body text-center">
          <h5>${v.name}</h5>
          <p class="text-muted">${v.status}</p>
          <button class="btn btn-success btn-sm" onclick="bookVehicle(${v.id})">Book</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function bookVehicle(id) {
  const user = localStorage.getItem("userEmail");
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  const vehicle = vehicles.find(v => v.id === id);
  bookings.push({ vehicle: vehicle.name, user, status: "Pending" });
  localStorage.setItem("bookings", JSON.stringify(bookings));
  alert("Request sent!");
  renderMyBookings();
}

function renderMyBookings() {
  const user = localStorage.getItem("userEmail");
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  const container = document.getElementById("myBookings");
  container.innerHTML = "";

  const my = bookings.filter(b => b.user === user);
  if (my.length === 0) {
    container.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-bordered";
  table.innerHTML = `
    <thead><tr><th>Vehicle</th><th>Status</th></tr></thead>
    <tbody>${my.map(b => `<tr><td>${b.vehicle}</td><td>${b.status}</td></tr>`).join("")}</tbody>
  `;
  container.appendChild(table);
}

// ---------- ADMIN ----------
function renderRequests() {
  const requests = JSON.parse(localStorage.getItem("bookings") || "[]");
  const container = document.getElementById("bookingRequests");
  container.innerHTML = "";

  const pending = requests.filter(r => r.status === "Pending");
  if (pending.length === 0) {
    container.innerHTML = "<p>No pending requests.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-bordered";
  table.innerHTML = `
    <thead><tr><th>Vehicle</th><th>Employee</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>
      ${pending.map((r, i) =>
        `<tr>
          <td>${r.vehicle}</td>
          <td>${r.user}</td>
          <td>${r.status}</td>
          <td>
            <button class="btn btn-success btn-sm" onclick="approveRequest(${i})">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectRequest(${i})">Reject</button>
          </td>
        </tr>`).join("")}
    </tbody>`;
  container.appendChild(table);
}

function approveRequest(i) {
  const requests = JSON.parse(localStorage.getItem("bookings") || "[]");
  const pending = requests.filter(b => b.status === "Pending");
  const r = pending[i];
  r.status = "Approved";

  const all = JSON.parse(localStorage.getItem("bookings") || "[]");
  const index = all.findIndex(b => b.vehicle === r.vehicle && b.user === r.user);
  all[index] = r;
  localStorage.setItem("bookings", JSON.stringify(all));

  const sent = JSON.parse(localStorage.getItem("emails") || "[]");
  sent.push({ to: r.user, subject: "Booking Approved", message: `Your booking for ${r.vehicle} has been approved.` });
  localStorage.setItem("emails", JSON.stringify(sent));

  alert(`Approval email sent to ${r.user}`);
  renderRequests();
  renderSentEmails();
}

function rejectRequest(i) {
  const requests = JSON.parse(localStorage.getItem("bookings") || "[]");
  const pending = requests.filter(b => b.status === "Pending");
  const r = pending[i];
  r.status = "Rejected";

  const all = JSON.parse(localStorage.getItem("bookings") || "[]");
  const index = all.findIndex(b => b.vehicle === r.vehicle && b.user === r.user);
  all[index] = r;
  localStorage.setItem("bookings", JSON.stringify(all));

  alert("Request rejected");
  renderRequests();
}

function renderSentEmails() {
  const emails = JSON.parse(localStorage.getItem("emails") || "[]");
  const container = document.getElementById("sentEmails");
  container.innerHTML = "";

  if (emails.length === 0) {
    container.innerHTML = "<p>No emails sent yet.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.className = "list-group";
  emails.forEach(e => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `<strong>To:</strong> ${e.to}<br><strong>Subject:</strong> ${e.subject}<br>${e.message}`;
    list.appendChild(li);
  });
  container.appendChild(list);
}
