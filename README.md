# my-first-project-cloud

## Architecture

The system design and validation boundary are documented in [Backend/architecture.md](Backend/architecture.md). The API contract is in [docs/api-contract.md](docs/api-contract.md).

Lab guides: [Part 3 architecture](docs/lab-03-architecture.md), [Part 4 HTTP requests](docs/lab-04-http-request-parts.md), and [Part 5 data model](docs/lab-05-issue-data-model.md).

## Lab 3 — Application and API Design

The Cloud Issue Tracker has a documented three-layer architecture and a REST API contract for creating, viewing, and changing issue status. The Express backend separates HTTP routes from its async data service, which reads and writes `Backend/data/issues.json`. Review the [API contract](docs/api-contract.md) and [API test plan](docs/api-test-plan.md) before extending the routes.

Start the backend from `Backend` with `npm start`; use `npm run dev` for watch mode. The frontend can also be started from `frontend` with `npm start`.
