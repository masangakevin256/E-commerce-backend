
// import mysql from "mysql2/promise";

// export const db = mysql.createPool({
//     host: process.env.HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DATABASE,
// });


import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // required for Supabase
  }
});







