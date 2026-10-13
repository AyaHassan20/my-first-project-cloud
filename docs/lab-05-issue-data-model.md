# Part 5 — Issue Data Model and API Contract

This document defines the target shape of an issue and the JSON contract shared by the frontend and API. The server owns generated fields; clients supply only the fields they are allowed to choose.

## Issue Data Model

| Field         | Type            | Source                     | Rule                                                          |
| ------------- | --------------- | -------------------------- | ------------------------------------------------------------- |
| `id`          | string          | Server                     | Required in stored and returned issues; unique and immutable. |
| `title`       | string          | Client                     | Required, trimmed, 3-100 characters.                          |
| `description` | string          | Client                     | Required, trimmed, 5-500 characters.                          |
| `priority`    | string enum     | Client                     | One of `Low`, `Medium`, or `High`.                            |
| `status`      | string enum     | Server / controlled update | `Open` or `Resolved`; new issues start as `Open`.             |
| `createdAt`   | ISO 8601 string | Server                     | Set when the issue is accepted; immutable.                    |

The `id`, `status`, and `createdAt` fields are server-controlled. A create request must not supply them; the API generates or initializes those values.

## API Contract

All request and response bodies use JSON. Requests with a JSON body send `Content-Type: application/json`; API responses use `Content-Type: application/json`.

| Operation       | Request                                                         | Success response                                              |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Create an issue | `POST /api/issues` with `title`, `description`, and `priority`  | `201 Created` and the complete created issue as JSON.         |
| View all issues | `GET /api/issues` with no body                                  | `200 OK` and an array of issues; return `[]` when none exist. |
| Change status   | `PATCH /api/issues/{id}/status` with `{ "status": "Resolved" }` | `200 OK` and the complete updated issue as JSON.              |

A create request body contains only client-supplied fields:

```json
{
  "title": "Projector not working in Lab 3",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "High"
}
```

A successful response includes the fields generated or controlled by the server:

```json
{
  "id": "ISS-102",
  "title": "Projector not working in Lab 3",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "High",
  "status": "Open",
  "createdAt": "2026-10-05T08:15:00Z"
}
```

## Error Contract

Errors use the same JSON envelope so the frontend can handle them consistently:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must contain between 3 and 100 characters."
  }
}
```

| Status                       | Error code               | Meaning and handling                                                                                                                          |
| ---------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`            | `VALIDATION_ERROR`       | The JSON is malformed or a field fails validation. Return a specific message; the frontend should show it and let the user correct the input. |
| `404 Not Found`              | `ISSUE_NOT_FOUND`        | The issue ID in the URL does not exist. The frontend should notify the user and reload the list.                                              |
| `413 Payload Too Large`      | `PAYLOAD_TOO_LARGE`      | The JSON request body exceeds the 1 MB parser limit.                                                                                          |
| `415 Unsupported Media Type` | `UNSUPPORTED_MEDIA_TYPE` | A request body is not JSON where JSON is required. Check that the client sends `Content-Type: application/json`.                              |
| `500 Internal Server Error`  | `INTERNAL_ERROR`         | An unexpected server failure occurred. Return a friendly generic message and write diagnostic details only to server logs.                    |

A `2xx` response represents success, a `4xx` response means the client request needs correction, and a `5xx` response means the server failed while handling a request.

## JSON Exchange

JSON is plain text used to exchange structured values between the browser and API. The browser serializes an object into the request body, and the `Content-Type` header identifies that body as JSON. The API parses and validates it before saving. The API returns JSON, which the browser parses before rendering. A JSON object uses `{}` and name/value pairs; a JSON array uses `[]` and contains an ordered list of values.

## Implementation Alignment

The Express server enforces this contract through `routes/issues.js` and `services/issueService.js`. The frontend uses the same field limits and calls `PATCH /api/issues/{id}/status`. The JSON file is a learning-scale data layer; replace it with a database for concurrent or production use.
