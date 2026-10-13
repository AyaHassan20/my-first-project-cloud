const express = require("express");
const {
  createIssue,
  readIssues,
  updateIssueStatus,
} = require("../services/issueService");

const router = express.Router();
const priorities = ["Low", "Medium", "High"];
const statuses = ["Open", "Resolved"];

function sendValidationError(response, message) {
  response.status(400).json({
    error: { code: "VALIDATION_ERROR", message },
  });
}

function requireJson(request, response, next) {
  if (!request.is("application/json")) {
    response.status(415).json({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Content-Type must be application/json.",
      },
    });
    return;
  }
  next();
}

router.get("/", async (request, response) => {
  response.status(200).json(await readIssues());
});

router.post("/", requireJson, async (request, response) => {
  const input = request.body;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    sendValidationError(response, "Request body must be a JSON object.");
    return;
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  if (title.length < 3 || title.length > 100) {
    sendValidationError(
      response,
      "Title must contain between 3 and 100 characters.",
    );
    return;
  }
  if (description.length < 5 || description.length > 500) {
    sendValidationError(
      response,
      "Description must contain between 5 and 500 characters.",
    );
    return;
  }
  if (!priorities.includes(input.priority)) {
    sendValidationError(response, "Priority must be Low, Medium, or High.");
    return;
  }

  const issue = await createIssue({
    title,
    description,
    priority: input.priority,
  });
  response.status(201).json(issue);
});

router.patch("/:id/status", requireJson, async (request, response) => {
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    sendValidationError(response, "Request body must be a JSON object.");
    return;
  }
  if (!statuses.includes(body.status)) {
    sendValidationError(response, "Status must be Open or Resolved.");
    return;
  }

  const issue = await updateIssueStatus(request.params.id, body.status);
  if (!issue) {
    response.status(404).json({
      error: {
        code: "ISSUE_NOT_FOUND",
        message: "The requested issue was not found.",
      },
    });
    return;
  }
  response.status(200).json(issue);
});

module.exports = router;
