# Cloud Issue Tracker Architecture

The application uses a browser frontend and an Express API. The server serves the frontend, validates requests, and reads or updates the server-side issue store; browser memory is not the source of truth.

```text
Browser
  |  GET /, frontend assets
  |  GET/POST /api/issues
  |  PATCH /api/issues/{id}/status
  v
Express server (port 8080 by default)
  |  routes/issues.js -> services/issueService.js
  |  read and write
  v
Backend/data/issues.json
```

Start the backend from `Backend` with `npm start`. Use `npm run dev` to restart automatically when backend source files change. The frontend's `npm start` script also starts the backend. The server uses `PORT` when set and otherwise listens on port 8080.

## Request Flow

1. The browser requests `/`. Express serves `frontend/index.html`, its CSS, and JavaScript. The frontend then calls `GET /api/issues` and renders the returned list.
2. To create an issue, the frontend sends `POST /api/issues` with title, description, and priority as JSON. The service validates the fields, assigns an ID, initial `Open` status, and timestamp, saves the issue, and returns it with `201 Created`.
3. To view issues, `GET /api/issues` reads the JSON data file and returns `200 OK` with an array. An empty collection is returned as `[]`.
4. To resolve or reopen an issue, the frontend sends `PATCH /api/issues/{id}/status`. The service validates the ID and status, changes only the status field, saves the record, and returns the updated issue with `200 OK`.

## API and Validation

Create requests require `Content-Type: application/json`. Titles are trimmed and must contain 3-100 characters; descriptions are trimmed and must contain 5-500 characters; priority must be `Low`, `Medium`, or `High`. Create requests cannot set server-controlled `id`, `status`, or `createdAt` fields. Status updates accept `Open` or `Resolved`.

Errors use a shared JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must contain between 3 and 100 characters."
  }
}
```

The API returns `400` for invalid JSON or fields, `404` for an unknown issue ID, `413` for a body over 1 MB, `415` for a non-JSON request body, and a generic `500` response for unexpected failures. Internal diagnostics are logged server-side rather than returned to clients.

## Trust Boundary and Limits

The browser and every request it sends are user-controlled. Client-side validation improves usability but is not trusted; the API repeats validation before data reaches the service. The browser never accesses the data file directly. Issue text is rendered with `textContent`, not as HTML.

`Backend/data/issues.json` persists issues across reloads and server restarts and is suitable for this learning project. It does not provide transactions or coordination across multiple server instances. The application also has no authentication or per-user authorization; production use requires a managed database, authentication, authorization, backups, and monitoring.
