const issueForm = document.querySelector("#issue-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const priorityInput = document.querySelector("#priority");
const issuesList = document.querySelector("#issues-list");
const issueCount = document.querySelector("#issue-count");
const formMessage = document.querySelector("#form-message");
const titleError = document.querySelector("#title-error");
const descriptionError = document.querySelector("#description-error");
const priorityError = document.querySelector("#priority-error");
let issues = [];

async function apiRequest(url, options) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorBody = result.error || {};
    const error = new Error(
      typeof errorBody === "string"
        ? errorBody
        : errorBody.message || "The request could not be completed.",
    );
    error.status = response.status;
    error.code = typeof errorBody === "object" ? errorBody.code : undefined;
    throw error;
  }
  return result;
}

function showMessage(message, retryAction) {
  formMessage.replaceChildren(document.createTextNode(message));
  if (retryAction) {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", retryAction);
    formMessage.append(" ", retryButton);
  }
}

function clearFieldErrors() {
  titleError.textContent = "";
  descriptionError.textContent = "";
  priorityError.textContent = "";
}

function handleRequestError(error, retryAction) {
  if (error.status === 404) {
    showMessage("This issue no longer exists. The issue list was refreshed.");
    loadIssues();
    return;
  }
  if (error.status === 415) {
    showMessage("The request must use JSON. Refresh the page and try again.");
    return;
  }
  if (error.status >= 500) {
    showMessage("Something went wrong. Please try again later.", retryAction);
    return;
  }
  showMessage(error.message);
}

function renderIssues() {
  issuesList.replaceChildren();
  issueCount.textContent = issues.length;

  issues.forEach((issue) => {
    const card = document.createElement("article");
    card.className = "issue-card";

    const heading = document.createElement("h3");
    heading.textContent = issue.title;

    const description = document.createElement("p");
    description.textContent = issue.description;

    const meta = document.createElement("p");
    meta.textContent = `Priority: ${issue.priority} | Status: ${issue.status}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = issue.status === "Open" ? "Mark Resolved" : "Reopen";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const updatedIssue = await apiRequest(
          `/api/issues/${encodeURIComponent(issue.id)}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: issue.status === "Open" ? "Resolved" : "Open",
            }),
          },
        );
        issues = issues.map((item) =>
          item.id === updatedIssue.id ? updatedIssue : item,
        );
        showMessage(`Issue status changed to ${updatedIssue.status}.`);
        renderIssues();
      } catch (error) {
        button.disabled = false;
        handleRequestError(error, () => button.click());
      }
    });

    card.append(heading, description, meta, button);
    issuesList.append(card);
  });
}

async function loadIssues() {
  try {
    issues = await apiRequest("/api/issues");
    renderIssues();
  } catch (error) {
    handleRequestError(error, loadIssues);
  }
}

issueForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldErrors();

  const submitButton = issueForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const newIssue = await apiRequest("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        priority: priorityInput.value,
      }),
    });
    issues.push(newIssue);
    issueForm.reset();
    priorityInput.value = "Medium";
    showMessage("Issue created and saved.");
    renderIssues();
  } catch (error) {
    const target = error.message.startsWith("Title")
      ? titleError
      : error.message.startsWith("Description")
        ? descriptionError
        : error.message.startsWith("Priority")
          ? priorityError
          : null;
    if (error.code === "VALIDATION_ERROR" && target) {
      target.textContent = error.message;
    } else {
      handleRequestError(error, () => issueForm.requestSubmit());
    }
  } finally {
    submitButton.disabled = false;
  }
});

titleInput.addEventListener("input", () => {
  titleError.textContent = "";
});
descriptionInput.addEventListener("input", () => {
  descriptionError.textContent = "";
});
priorityInput.addEventListener("change", () => {
  priorityError.textContent = "";
});

loadIssues();
