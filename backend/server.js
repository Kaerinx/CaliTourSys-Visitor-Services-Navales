require("dotenv").config();

const app = require("./src/app");

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`CaliTourSys backend running on port ${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set a different PORT in your environment or stop the process using that port.`);
    process.exit(1);
  }
  console.error("Server error:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
