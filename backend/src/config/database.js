require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let isConnectedLogged = false;
pool.on("connect", () => {
  if (!isConnectedLogged) {
    console.log("PostgreSQL connected");
    isConnectedLogged = true;
  }
});

pool.on("error", (error) => {
  console.error("PostgreSQL error:", error);
});

module.exports = pool;