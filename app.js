// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
// import helmet from "helmet";

import pool from "./db.js";

import authRouter from './routes/auth/auth.rout.js';
import linkedinRoutes from "./routes/linkedin/linkedinRoutes.js";
import titleGenerator from "./routes/postGenerater/postGenerator.js";
// middleware
//routs

// google img pproxy


// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT;



app.use(cookieParser()); 
// Security headers
// app.use(helmet());
// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://congra.netlify.app"], // adjust as needed
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.send({ message: "Autolin API is running..." });
});

// ---------- API Routes ----------

// Public
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/linkedin", linkedinRoutes);
app.use("/api/v1/postGenerator", titleGenerator);


// ---------- Error & 404 Handling ----------

// 404 handler
app.use((req, res) => {
  console.warn(`⚠️ 404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack || err.message);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal server error" });
});

// ---------- DB Connection Test ----------
(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected. Current time:", result.rows[0]);
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// ---------- Start Server ----------
app.listen(PORT, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  } else {
    console.log(`✅ Server running on port ${PORT}`);
  }
});

export default app;