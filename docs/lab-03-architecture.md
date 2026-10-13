# Lab 3 — Cloud Issue Tracker Architecture

## 1. Application Goal

The Cloud Issue Tracker lets users create issues, view the shared issue list, and change an issue's status. The browser handles the interface, while a Node.js API validates requests and reads or writes the server-side issue store. Keeping the issue data outside the browser means a page refresh does not discard newly created issues. This learning version stores data in a local JSON file; a production service would use a database and additional access controls.

## 2. Functional Scope

The application supports three operations:

- **Create an issue:** Submit a title, description, and priority. The API assigns an ID, creation time, and initial `Open` status.
- **View all issues:** Load the issue list from the API and render each issue in the frontend.
- **Change an issue status:** Submit an allowed status value for an existing issue.

## 3. Request Flow

**Create an issue**

```text
User -> Frontend form -> POST /api/issues (JSON) -> API validation -> Data layer
      <- Render new issue <- 201 Created + issue JSON <- Save issue with ID and Open status
```

The user enters a title and description, selects a priority, and submits the form. The frontend sends those fields as JSON. The API trims and validates a title of 3-100 characters, a description of 5-500 characters, and a supported priority before saving. Invalid input returns `400 Bad Request`; request bodies over 1 MB return `413 Payload Too Large`. Valid input is saved and returned as JSON with `201 Created`. The frontend adds the returned issue to the list.

**View all issues**

```text
Page load -> GET /api/issues -> API -> Data layer
         <- Render list <- 200 OK + JSON array <-
```

When the page loads, the frontend requests all issues. The API asks the data layer for every stored issue and returns `200 OK` with a JSON array, including an empty array when no issues exist. The frontend renders one row or card per issue, or displays **No issues yet** when the array is empty. If the data store cannot be read, the API returns `500 Internal Server Error`.

**Change an issue status**

```text
Button -> PATCH /api/issues/{id}/status -> API validation -> Data layer
      <- Re-render issue <- 200 OK + updated JSON <-
```

When the user clicks a status button, the frontend sends the new status as JSON, for example `{ "status": "Resolved" }`. The API checks that the issue exists and that the requested status is allowed. An unknown issue returns `404 Not Found`; an invalid status returns `400 Bad Request`. For a valid request, the data layer changes only that issue's status, and the API returns `200 OK` with the full updated issue as JSON. The frontend then re-renders that issue.

The implemented status endpoint is `PATCH /api/issues/{id}/status`; it changes only the issue's status.

## 4. Trust Boundaries

```text
USER-CONTROLLED SIDE                         APPLICATION-CONTROLLED SIDE

Browser input ---- HTTP request (untrusted) ----> REST API ----> Data layer
      ^                                             |
      +---------------- JSON response <-------------+
```

The **user-controlled side** is the browser: its form fields, buttons, and every HTTP request it sends. Users can modify these values with browser developer tools or send requests directly with tools such as `curl` or Postman. Treat every request as untrusted until the API validates it.

The **application-controlled side** is the REST API and data layer. The browser accesses issue data only through the API; the server-side JSON store is not exposed as a frontend file.

The boundary follows these rules:

1. The API validates every request. Frontend checks are for convenience, never security. Validate required fields, the 100-character title limit, the 500-character description limit, and allowed priority and status values before changing stored data.
2. The browser never accesses the data layer directly; all issue reads and writes pass through the API.
3. The API returns only the issue data and messages the frontend needs. Unexpected server errors are logged on the server and returned as a generic error without stack traces or internal details.
4. The frontend inserts issue text as plain text, not HTML. It uses `textContent` so user-provided titles and descriptions are not interpreted as markup.

This prototype has no authentication or per-user authorization, so anyone who can reach the API can view issues, create issues, and change statuses. A deployed multi-user service needs authentication, authorization, and a managed persistent database.
