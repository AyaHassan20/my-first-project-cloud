# Part 4 — HTTP Request and Response Parts

An HTTP request or response is made up of distinct parts. The issue JSON below is a resource representation carried in an HTTP body; its fields are not themselves the HTTP method, path, headers, or status code.

## 1. HTTP Method

Choose the method by asking what the user wants to do with the data. The method states the operation; reading with `GET` does not change server data.

| Method   | Use                                                      | Issue tracker example                                                             |
| -------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `GET`    | Read or retrieve data without changing it.               | `GET /api/issues` lists issues.                                                   |
| `POST`   | Create an item and let the server assign its ID.         | `POST /api/issues` creates an issue.                                              |
| `PATCH`  | Change part of an existing item.                         | `PATCH /api/issues/ISS-102/status` changes its status.                            |
| `PUT`    | Replace an entire existing item with a complete version. | `PUT /api/issues/ISS-102` would replace every field; not implemented in this lab. |
| `DELETE` | Remove an existing item.                                 | `DELETE /api/issues/ISS-102` would remove it; not implemented in this lab.        |

Together, Create, Read, Update, and Delete are called CRUD. `PUT` and `PATCH` are both update methods: `PUT` replaces the whole resource, while `PATCH` changes selected fields. This lab implements create, read, and status update; it does not need `PUT` or `DELETE`.

## 2. Path / Endpoint

An endpoint is the URL address a client uses to reach a resource. Use plural nouns for collections and an ID to identify one item:

- `POST /api/issues` creates an issue.
- `GET /api/issues` returns all issues.
- `PATCH /api/issues/ISS-102/status` changes the status of issue `ISS-102`.

Prefer resource names over action verbs because the HTTP method already describes the action. For example, `POST /api/issues` is preferred over `POST /api/createIssue`, and `GET /api/issues` over `GET /api/getAllIssues`. Keep paths lowercase and use hyphens for multiword names.

If related resources are added later, keep nesting shallow, for example `GET /api/issues/ISS-102/comments`; comments are not part of the current application. Query parameters can later support filtering, sorting, or paging, such as `GET /api/issues?priority=High`; filtering is not currently implemented.

The status subresource uses the noun `status`. The implemented endpoint is `PATCH /api/issues/{id}/status`.

## 3. Headers

Headers carry metadata about the request or response. JSON requests use `Content-Type: application/json`. JSON API responses use `Content-Type: application/json; charset=utf-8`. For example:

```http
POST /api/issues HTTP/1.1
Host: localhost:8080
Content-Type: application/json
```

## 4. Body

A body is optional data sent with a request or response. A `GET` request has no body. To create an issue, send the user-provided fields; the API assigns the ID, status, and creation time:

```json
{
  "title": "Projector not working in Lab 3",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "High"
}
```

To change its status, the current API accepts a JSON body such as:

```json
{
  "status": "Resolved"
}
```

The full issue object is returned by the API and appears as an item in the `GET /api/issues` response:

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

## 5. Status Code

The status code is the machine-readable result in the HTTP response:

- `201 Created`: the issue was created successfully; the response includes its JSON representation.
- `200 OK`: the issue list was returned or a status change succeeded.
- `400 Bad Request`: the JSON or submitted field values are invalid.
- `404 Not Found`: the requested issue does not exist.
- `413 Payload Too Large`: the request body exceeds the API size limit.
- `415 Unsupported Media Type`: a request body does not use `Content-Type: application/json`.
- `500 Internal Server Error`: an unexpected server-side failure occurred; the response does not expose internal details.

## 6. Endpoint Design Checklist

Check each endpoint against these questions:

1. Does the URL name a resource with a noun rather than an action verb?
2. Is a collection named with a plural noun, such as `/api/issues`?
3. Does the HTTP method express the requested action?
4. Is the naming consistent across the API?

For example, `POST /api/issues` creates an issue, `GET /api/issues` reads the collection, and `PATCH /api/issues/ISS-102` changes part of one issue. Prefer these over action-oriented paths such as `/api/createIssue` or `/api/getAllIssues`.

## 7. Status Codes and Validation

The first digit groups the result: `2xx` means success, `4xx` means the request must be fixed by the client, and `5xx` means the server failed while handling a request. Handle common responses as follows:

| Code                         | Meaning                                                                                      | Client behavior                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `200 OK`                     | A read or partial update succeeded. An empty issue list is still a successful `[]` response. | Parse the JSON and update the page; do not show an empty list as an error.                              |
| `201 Created`                | An issue was created. The body contains the full server-created issue.                       | Add the returned issue and use its server-generated ID, status, and timestamp.                          |
| `400 Bad Request`            | The body is malformed or input violates a rule.                                              | Show the specific validation message and let the user correct and resubmit; do not retry automatically. |
| `404 Not Found`              | The requested issue ID does not exist.                                                       | Explain that the issue is no longer available and reload the list.                                      |
| `415 Unsupported Media Type` | A JSON endpoint received a body with a non-JSON content type.                                | Treat this as a client programming error and send `Content-Type: application/json`.                     |
| `500 Internal Server Error`  | An unexpected server failure occurred.                                                       | Show a friendly retry message; keep diagnostic details in server logs, not the response.                |

The API uses a consistent error body, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must contain between 3 and 100 characters."
  }
}
```

Validation happens in the API before data is saved. Frontend checks provide quick feedback but cannot be trusted because clients can change requests or call the API directly. The model limits and standard error shape above are implemented by the backend.
