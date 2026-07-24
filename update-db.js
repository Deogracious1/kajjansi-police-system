const db = require("./database");

db.run(
    "ALTER TABLE officers ADD COLUMN photo TEXT",
    (err) => {
        if (err) {
            console.log(err.message);
        } else {
            console.log("Photo column added.");
        }

        db.close();
    }
);