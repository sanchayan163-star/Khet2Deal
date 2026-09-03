const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Pa@27092005",
    database: "Khet2Deal"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed ❌", err.message);
        return;
    }

    console.log("MySQL connected successfully ✅");
});

module.exports = db;