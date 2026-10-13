# API Contract: Issues API

This contract defines the JSON data shared by the frontend and backend. The server is authoritative for IDs, statuses, and creation timestamps.

## Data Dictionary: Issue

| Field         | Type              | Source                     | Rule                                                             |
| ------------- | ----------------- | -------------------------- | ---------------------------------------------------------------- |
| `id`          | string            | Server                     | Required in stored and returned resources; unique and immutable. |
| `title`       | string            | Client                     | Required; trim whitespace; 3-100 characters.                     |
| `description` | string            | Client                     | Required; trim whitespace; 5-500 characters.                     |
| `priority`    | string enum       | Client                     | One of `Low`, `Medium`, or `High`.                               |
| `status`      | string enum       | Server / controlled update | `Open` or `Resolved`; new issues start as `Open`.                |
| `createdAt`   | string (ISO 8601) | Server                     | Created when the issue is accepted; immutable.                   |

Create requests must not provide `id`, `status`, or `createdAt`; the server assigns or controls those fields.

A complete issue returned by the API has this shape:

```json
{
  "id": "ISS-101",
  "title": "Unable to access Wi-Fi",
  "description": "Connection fails in the teaching lab.",
  "priority": "High",
  "status": "Open",
  "createdAt": "2026-09-15T12:30:00.000Z"
}
```

## Contract 1: View All Issues

- Request: `GET /api/issues`
- Request body: none
- Success: `200 OK` with a JSON array of issues.

```json
[
  {
    "id": "ISS-101",
    "title": "Unable to access Wi-Fi",
    "description": "Connection fails in the teaching lab.",
    "priority": "High",
    "status": "Open",
    "createdAt": "2026-09-15T12:30:00.000Z"
  }
]
```

An empty result is successful and returns `200 OK` with `[]`. A store failure returns `500 Internal Server Error`.

## Contract 2: Create an Issue

- Request: `POST /api/issues`
- Required header: `Content-Type: application/json`
- Request body: client-owned fields only.

```json
{
  "title": "Projector not detected",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "Medium"
}
```

Success is `201 Created` with the complete created issue, including its server-generated ID, initial status, and timestamp. Invalid JSON or field values return `400 Bad Request`; a request body over 1 MB returns `413 Payload Too Large`; a non-JSON content type returns `415 Unsupported Media Type`; unexpected failures return `500 Internal Server Error`.

## Contract 3: Change Issue Status

- Request: `PATCH /api/issues/{id}/status`
- Required header: `Content-Type: application/json`
- Request body:

```json
{
  "status": "Resolved"
}
```

Success is `200 OK` with the complete updated issue. Invalid JSON or a status outside the allowed values returns `400 Bad Request`; an unknown issue ID returns `404 Not Found`; a request body over 1 MB returns `413 Payload Too Large`; a non-JSON content type returns `415 Unsupported Media Type`; unexpected failures return `500 Internal Server Error`.

## Error Responses

Every error response uses the same JSON shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must contain between 3 and 100 characters."
  }
}
```

| Status | Code                     | Returned when                                                                                      |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`       | The body is malformed, a required value is missing, or a field breaks a model rule.                |
| `404`  | `ISSUE_NOT_FOUND`        | The issue ID in the URL does not exist.                                                            |
| `413`  | `PAYLOAD_TOO_LARGE`      | The JSON request body exceeds 1 MB.                                                                |
| `415`  | `UNSUPPORTED_MEDIA_TYPE` | The body is not JSON although the endpoint requires JSON.                                          |
| `500`  | `INTERNAL_ERROR`         | An unexpected server error occurs; details are logged server-side and not exposed in the response. |
