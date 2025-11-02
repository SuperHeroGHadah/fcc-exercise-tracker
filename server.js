
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* ---------- MongoDB (optional for now) ---------- */
// If you haven't set MONGO_URI yet, the app will still boot.
const uri = process.env.MONGO_URI;
if (uri) {
  mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));
} else {
  console.log("ℹ️ No MONGO_URI found in environment. Skipping DB connect.");
}

/* ---------- Routes ---------- */
app.get("/", (_req, res) => {
  // Serve a minimal landing page so sendFile never errors.
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/api/hello", (_req, res) => {
  res.json({ greeting: "Hello Exercise Tracker" });
});

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log("🚀 Server listening on port", listener.address().port);
});
