document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          // build participants list with delete buttons
          const participantItems = details.participants
            .map((p) => {
              // using data attributes to identify participant email
              return `<li class="participant-item" data-activity="${escapeHtml(
                name
              )}" data-email="${escapeHtml(p)}">
                        <span class="participant-email">${escapeHtml(p)}</span>
                        <button class="participant-delete" title="Unregister ${escapeHtml(
                          p
                        )}" aria-label="Unregister ${escapeHtml(p)}">
                          <!-- simple trash icon -->
                          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18v2H3V6zm2 3h14l-1 12H6L5 9zm3-7h6l1 2H7l1-2z"/>
                          </svg>
                        </button>
                      </li>`;
            })
            .join("");

          participantsHTML = `<div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${participantItems}
              </ul>
            </div>`;
        } else {
          participantsHTML = `<div class="participants-section no-participants"><em>No participants yet</em></div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the newly registered participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Attach event listeners for delete buttons (delegation) once
  activitiesList.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".participant-delete");
    if (!deleteBtn) return;

    const li = deleteBtn.closest(".participant-item");
    if (!li) return;

    const activityName = li.getAttribute("data-activity");
    const email = li.getAttribute("data-email");

    if (!activityName || !email) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
          email
        )}`,
        { method: "DELETE" }
      );

      if (resp.ok) {
        // Re-fetch activities to update UI and counts
        await fetchActivities();
      } else {
        const res = await resp.json().catch(() => ({}));
        alert(res.detail || "Failed to unregister participant");
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      alert("Failed to unregister participant. Check console for details.");
    }
  });

  // Initialize app
  fetchActivities();
});

// Helper to escape HTML to avoid injection if participants/emails contain special chars
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
