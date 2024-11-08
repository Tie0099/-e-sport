// db.js

import mysql from 'mysql';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'yourusername',
  password: 'yourpassword',
  database: 'yourdatabase'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected!');
});

export default db;
