const issueForm = document.querySelector("#issue-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const priorityInput = document.querySelector("#priority");
const issuesList = document.querySelector("#issues-list");
const issueCount = document.querySelector("#issue-count");
const formMessage = document.querySelector("#form-message");
const issues = [
  {
    id: "ISS-101",
    title: "Unable to access Wi-Fi",
    description: "Connection fails in the teaching lab.",
    priority: "High",
    status: "Open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ISS-102",
    title: "Projector not detected",
    description: "Laptop cannot detect the classroom projector.",
    priority: "Medium",
    status: "Open",
    createdAt: new Date().toISOString(),
  },
];
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
    meta.textContent = `Priority: ${issue.priority} | Status: 
${issue.status}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = issue.status === "Open" ? "Mark Resolved" : "Reopen";
    button.addEventListener("click", () => toggleIssueStatus(issue.id));

    card.append(heading, description, meta, button);
    issuesList.append(card);
  });
}
issueForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newIssue = {
    id: `ISS-${Date.now()}`,
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
    status: "Open",
    createdAt: new Date().toISOString(),
  };

  issues.push(newIssue);
  issueForm.reset();
  priorityInput.value = "Medium";
  formMessage.textContent = "Issue added to the local browser session.";
  renderIssues();
});
renderIssues();
