const express = require("express");
const path = require("node:path");
const issueRoutes = require("./routes/issues");

const frontendDirectory = path.resolve(__dirname, "../frontend");
const port = Number(process.env.PORT || 8080);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: 1_000_000 }));
app.use("/api/issues", issueRoutes);
app.use("/api", (request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint was not found.",
    },
  });
});
app.use(
  express.static(frontendDirectory, {
    setHeaders(response) {
      response.setHeader("Cache-Control", "no-store");
    },
  }),
);
app.use((request, response) => {
  response.status(404).send("Not found");
});
app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.type === "entity.parse.failed") {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be valid JSON.",
      },
    });
    return;
  }

  if (error.type === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body must not exceed 1 MB.",
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again later.",
    },
  });
});

app.listen(port, () => {
  console.log(`Cloud Issue Tracker is running at http://localhost:${port}`);
});
