
import mysql from "mysql2/promise";

export const db = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
});

console.log(process.env.DATABASE);




