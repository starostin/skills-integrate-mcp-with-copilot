document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupHelper = document.getElementById("signup-helper");
  const teacherBadge = document.getElementById("teacher-badge");
  const authToggle = document.getElementById("auth-toggle");
  const authMenu = document.getElementById("auth-menu");
  const authAction = document.getElementById("auth-action");
  const authStatusText = document.getElementById("auth-status-text");
  const loginModal = document.getElementById("login-modal");
  const closeLoginModal = document.getElementById("close-login-modal");
  const loginForm = document.getElementById("login-form");

  let authToken = localStorage.getItem("teacherAuthToken");
  let teacherUsername = localStorage.getItem("teacherUsername");

  function setMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    window.clearTimeout(setMessage.timeoutId);
    setMessage.timeoutId = window.setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function getAuthHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  function closeAuthMenu() {
    authMenu.classList.add("hidden");
    authToggle.setAttribute("aria-expanded", "false");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    document.getElementById("username").focus();
  }

  function closeModal() {
    loginModal.classList.add("hidden");
    loginForm.reset();
  }

  function setAuthState(authenticated, username = "", token = "") {
    authToken = authenticated ? token : null;
    teacherUsername = authenticated ? username : null;

    if (authenticated) {
      localStorage.setItem("teacherAuthToken", token);
      localStorage.setItem("teacherUsername", username);
    } else {
      localStorage.removeItem("teacherAuthToken");
      localStorage.removeItem("teacherUsername");
    }

    authStatusText.textContent = authenticated
      ? `Signed in as ${username}`
      : "Student view";
    authAction.textContent = authenticated ? "Log Out" : "Teacher Login";
    teacherBadge.textContent = authenticated ? username : "";
    teacherBadge.classList.toggle("hidden", !authenticated);

    signupForm.querySelectorAll("input, select, button").forEach((element) => {
      element.disabled = !authenticated;
    });

    signupHelper.textContent = authenticated
      ? "Teacher controls enabled. You can register or remove students."
      : "Teacher login required to register or remove students from activities.";
    signupHelper.className = authenticated ? "success info-banner" : "info info-banner";
  }

  async function syncSession() {
    if (!authToken) {
      setAuthState(false);
      return;
    }

    try {
      const response = await fetch("/auth/session", {
        headers: getAuthHeaders(),
      });
      const session = await response.json();

      if (session.authenticated) {
        setAuthState(true, session.username, authToken);
      } else {
        setAuthState(false);
      }
    } catch (error) {
      setAuthState(false);
      console.error("Error checking session:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        authToken
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Remove ${email} from ${name}">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        if (response.status === 401) {
          setAuthState(false);
        }

        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        if (response.status === 401) {
          setAuthState(false);
        }

        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  authToggle.addEventListener("click", () => {
    const isHidden = authMenu.classList.toggle("hidden");
    authToggle.setAttribute("aria-expanded", String(!isHidden));
  });

  authAction.addEventListener("click", async () => {
    closeAuthMenu();

    if (!authToken) {
      openLoginModal();
      return;
    }

    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      setAuthState(false);
      setMessage(result.message || "Logged out.", "success");
      fetchActivities();
    } catch (error) {
      setMessage("Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.detail || "Login failed.", "error");
        return;
      }

      setAuthState(true, result.username, result.token);
      closeModal();
      setMessage(`Teacher mode enabled for ${result.username}.`, "success");
      fetchActivities();
    } catch (error) {
      setMessage("Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  closeLoginModal.addEventListener("click", closeModal);

  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeModal();
    }
  });

  document.addEventListener("click", (event) => {
    if (!authMenu.contains(event.target) && !authToggle.contains(event.target)) {
      closeAuthMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAuthMenu();
      closeModal();
    }
  });

  // Initialize app
  syncSession().then(fetchActivities);
});
