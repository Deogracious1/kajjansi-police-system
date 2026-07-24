const db = require("./database");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO users
    (id, username, password, role)
    VALUES
    (1, 'admin', 'admin123', 'Administrator')
  `);

  console.log("Database initialized.");
});

db.run(`
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    complaint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number TEXT UNIQUE,
    complainant_name TEXT,
    case_title TEXT,
    description TEXT,
    officer TEXT,
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_number TEXT UNIQUE,
    full_name TEXT,
    rank TEXT,
    phone TEXT,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);


db.close();