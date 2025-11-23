import mysql from "mysql2/promise";

const MYSQL_URL = 'mysql://root:1234@localhost:3306/ecommerce'; 
const pool = mysql.createPool(MYSQL_URL);

export default pool;