const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "database", "police.db"),
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Connected to SQLite database.");
        }
    }
);

db.all(
    "SELECT * FROM activities",
    [],
    (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            console.table(rows);
        }
    }
);

db.serialize(() => {

    // ==========================
    // USERS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'Administrator',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // OFFICERS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS officers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_number TEXT UNIQUE,
        full_name TEXT,
        rank TEXT,
        phone TEXT,
        department TEXT,
        photo TEXT,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // COMPLAINTS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS complaints(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        complaint TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // CASES
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS cases(
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

    // ==========================
    // ARRESTS / PRISONERS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS arrests(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        arrest_number TEXT UNIQUE,
        suspect_name TEXT,
        national_id TEXT,
        gender TEXT,
        age INTEGER,
        phone TEXT,
        address TEXT,
        offence TEXT,
        case_number TEXT,
        arrest_date TEXT,
        arrest_time TEXT,
        arrest_location TEXT,
        arresting_officer TEXT,
        cell_number TEXT,
        status TEXT DEFAULT 'In Custody',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // VISITORS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS visitors(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_number TEXT UNIQUE,
        full_name TEXT,
        national_id TEXT,
        phone TEXT,
        gender TEXT,
        address TEXT,
        visit_type TEXT,
        person_to_visit TEXT,
        purpose TEXT,
        date TEXT,
        time_in TEXT,
        time_out TEXT,
        visit_status TEXT DEFAULT 'Inside',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // PRISONERS (OPTIONAL)
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS prisoners(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prisoner_number TEXT UNIQUE,
        full_name TEXT,
        national_id TEXT,
        crime TEXT,
        case_number TEXT,
        date_of_arrest TEXT,
        cell_number TEXT,
        sentence TEXT,
        status TEXT DEFAULT 'In Custody',
        remarks TEXT
    )
    `);

    // ==========================
    // ACTIVITIES
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS activities(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity TEXT,
        officer TEXT,
        activity_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // EVIDENCE / EXHIBITS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS exhibits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exhibit_number TEXT UNIQUE,
        case_number TEXT,
        exhibit_name TEXT,
        description TEXT,
        recovered_from TEXT,
        recovered_by TEXT,
        date_recovered TEXT,
        status TEXT DEFAULT 'Stored'
    )
    `);

    // ==========================
    // CELLS
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS cells(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cell_number TEXT UNIQUE,
        capacity INTEGER,
        occupied INTEGER DEFAULT 0,
        remarks TEXT
    )
    `);

    // ==========================
    // VEHICLES
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS vehicles(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_number TEXT UNIQUE,
        owner_name TEXT,
        offence TEXT,
        officer TEXT,
        impound_date TEXT,
        status TEXT DEFAULT 'Impounded'
    )
    `);

    // ==========================
    // PROPERTY
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS property(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_number TEXT UNIQUE,
        owner_name TEXT,
        description TEXT,
        case_number TEXT,
        status TEXT DEFAULT 'Stored'
    )
    `);

    // ==========================
    // BAIL
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS bail(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suspect_name TEXT,
        case_number TEXT,
        granted_by TEXT,
        date_granted TEXT,
        amount REAL,
        remarks TEXT
    )
    `);

    // ==========================
    // COURT
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS court_cases(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_number TEXT,
        court_name TEXT,
        magistrate TEXT,
        hearing_date TEXT,
        outcome TEXT
    )
    `);

    // ==========================
    // LOGIN HISTORY
    // ==========================

    db.run(`
    CREATE TABLE IF NOT EXISTS login_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // DEFAULT ADMIN
    // ==========================

    db.get(
        "SELECT * FROM users WHERE username='admin'",
        [],
        (err, row) => {

            if (!row) {

                db.run(
                    `INSERT INTO users
                    (full_name,username,password,role)
                    VALUES
                    (?,?,?,?)`,
                    [
                        "System Administrator",
                        "admin",
                        "admin123",
                        "Administrator"
                    ]
                );

                console.log("Default admin created.");
            }

        }
    );

    // ==========================
    // SHOW TABLES
    // ==========================

    db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        [],
        (err, rows) => {

            if (!err) {

                console.log("\nDATABASE TABLES");
                console.table(rows);

            }

        }
    );

});

module.exports = db;