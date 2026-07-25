const multer = require("multer");
const db = require("./database");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

function logActivity(activity, officer = "System") {

    db.run(
        `INSERT INTO activities
        (activity, officer)
        VALUES (?, ?)`,
        [activity, officer]
    );

}

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "kajjansi-police-secret",
    resave: false,
    saveUninitialized: false,
  })
);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + "-" + file.originalname
        );
    }
});

const upload = multer({
    storage: storage
});

app.get("/arrests", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.all(
        "SELECT * FROM arrests ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.render("arrests", {
                arrests: rows
            });

        }
    );

});

app.get("/arrests/new", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const arrestNumber =
        "KPS-AR-" +
        new Date().getFullYear() +
        "-" +
        Date.now();

    db.all(
        "SELECT case_number FROM cases ORDER BY id DESC",
        [],
        (err, cases) => {

            if (err) {
                return res.send("Database error");
            }

            db.all(
                "SELECT full_name FROM officers ORDER BY full_name",
                [],
                (err, officers) => {

                    if (err) {
                        return res.send("Database error");
                    }

                    res.render("new-arrest", {
                        arrestNumber,
                        cases,
                        officers
                    });

                }
            );

        }
    );

});

app.get("/officers", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.all(
        "SELECT * FROM officers ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.send("Database error");
            }

            res.render("officers", {
                officers: rows
            });
        }
    );
});

app.get("/officers/new", (req, res) => {
    res.render("new-officer");
});

app.post("/arrests", (req, res) => {

    const {
        arrest_number,
        suspect_name,
        national_id,
        gender,
        age,
        phone,
        address,
        offence,
        case_number,
        arrest_date,
        arrest_time,
        arrest_location,
        arresting_officer,
        cell_number,
        remarks
    } = req.body;

    db.run(
        `INSERT INTO arrests
        (
            arrest_number,
            suspect_name,
            national_id,
            gender,
            age,
            phone,
            address,
            offence,
            case_number,
            arrest_date,
            arrest_time,
            arrest_location,
            arresting_officer,
            cell_number,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            arrest_number,
            suspect_name,
            national_id,
            gender,
            age,
            phone,
            address,
            offence,
            case_number,
            arrest_date,
            arrest_time,
            arrest_location,
            arresting_officer,
            cell_number,
            remarks
        ],
        (err) => {

            if (err) {
                console.log(err);
                return res.send(err.message);
            }

            res.redirect("/arrests");
logActivity(
    "Arrest registered: " + suspect_name,
    req.session.user.username
);
        }
    );

});

app.post("/officers", (req, res) => {
    const {
        badge_number,
        full_name,
        rank,
        phone,
        department
    } = req.body;

    const photo = req.body.croppedPhoto;

    let photoPath = null;

    if (photo) {
        const base64Data =
            photo.replace(
                /^data:image\/\w+;base64,/,
                ""
            );

        const fileName =
            Date.now() + ".jpg";

        photoPath =
            "/uploads/" + fileName;

        fs.writeFileSync(
            "public" + photoPath,
            base64Data,
            "base64"
        );
    }

    db.run(
        `INSERT INTO officers
        (
            badge_number,
            full_name,
            rank,
            phone,
            department,
            photo
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            badge_number,
            full_name,
            rank,
            phone,
            department,
            photoPath
        ],
        (err) => {
            if (err) {
                console.log(err);
                return res.send(err.message);
            }

            res.redirect("/officers");
        logActivity(
    "Officer added: " + full_name,
    req.session.user.username
);
        }
    );
});

app.get("/officers/:id", (req, res) => {
    const id = req.params.id;

    db.get(
        "SELECT * FROM officers WHERE id = ?",
        [id],
        (err, officer) => {
            if (err || !officer) {
                return res.send("Officer not found");
            }

            db.all(
                "SELECT * FROM cases WHERE officer = ?",
                [officer.full_name],
                (err, cases) => {
                    if (err) {
                        return res.send("Database error");
                    }

                    res.render("officer-profile", {
                        officer,
                        cases
                    });
                }
            );
        }
    );
});

app.get("/officers/edit/:id", (req, res) => {
    const id = req.params.id;

    db.get(
        "SELECT * FROM officers WHERE id = ?",
        [id],
        (err, row) => {
            if (err) {
                return res.send("Database error");
            }

            if (!row) {
                return res.send("Officer not found");
            }

            res.render("edit-officer", {
                officer: row
            });
        }
    );
});

app.get("/cases/delete/:id", (req, res) => {
    const id = req.params.id;

    db.run(
        "DELETE FROM cases WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                return res.send("Database error");
            }

            res.redirect("/cases");
        }
    );
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/officers/update/:id", (req, res) => {

    const id = req.params.id;

    const {
        badge_number,
        full_name,
        rank,
        phone,
        department,
        croppedPhoto
    } = req.body;

    db.get(
        "SELECT * FROM officers WHERE id = ?",
        [id],
        (err, officer) => {

            if (err || !officer) {
                return res.send("Officer not found");
            }

            let photoPath = officer.photo;

            if (croppedPhoto) {

                const base64Data = croppedPhoto.replace(
                    /^data:image\/\w+;base64,/,
                    ""
                );

                const fileName = Date.now() + ".jpg";

                photoPath = "/uploads/" + fileName;

                fs.writeFileSync(
                    "public" + photoPath,
                    base64Data,
                    "base64"
                );
            }

            db.run(
                `UPDATE officers
                 SET badge_number = ?,
                     full_name = ?,
                     rank = ?,
                     phone = ?,
                     department = ?,
                     photo = ?
                 WHERE id = ?`,
                [
                    badge_number,
                    full_name,
                    rank,
                    phone,
                    department,
                    photoPath,
                    id
                ],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.send(err.message);
                    }

                    res.redirect("/officers/" + id);

                }
            );

        }

    );

});

app.post("/login", (req, res) => {
    console.log("Login button clicked");
    console.log("Form data:", req.body);

    const { username, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password],
        (err, user) => {
            if (err) {
                console.log("Database error:", err);
                return res.send("Database error");
            }

            console.log("User found:", user);

            if (!user) {
                return res.send(`
<!DOCTYPE html>
<html>

<head>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

</head>

<body>

<script>

Swal.fire({

    icon:'error',

    title:'Login Failed',

    text:'Invalid username or password.',

    confirmButtonColor:'#0B2E59'

}).then(()=>{

    window.location="/login";

});

</script>

</body>

</html>
`);
            }

            req.session.user = user;
            console.log("Redirecting to dashboard...");

            res.send(`
<!DOCTYPE html>
<html>

<head>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

</head>

<body>

<script>

Swal.fire({

    icon:'success',

    title:'Welcome',

    text:'Login Successful',

    timer:1500,

    showConfirmButton:false

});

setTimeout(()=>{

window.location="/dashboard";

},1500);

</script>

</body>

</html>
`);
        }
    );
});

app.get("/dashboard", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.get(
        "SELECT COUNT(*) AS totalComplaints FROM complaints",
        (err, complaints) => {

            if (err) return res.send("Database error");

            db.get(
                "SELECT COUNT(*) AS totalCases FROM cases",
                (err, cases) => {

                    if (err) return res.send("Database error");

                    db.get(
                        "SELECT COUNT(*) AS totalOfficers FROM officers",
                        (err, officers) => {

                            if (err) return res.send("Database error");

                            db.get(
                                "SELECT COUNT(*) AS totalArrests FROM arrests",
                                (err, arrests) => {

                                    if (err) return res.send("Database error");

                                    db.all(
                                        "SELECT * FROM activities ORDER BY id DESC LIMIT 10",
                                        [],
                                        (err, activities) => {

                                            if (err) {
                                                return res.send("Database error");
                                            }

                                            res.render("dashboard", {
                                                user: req.session.user,
                                                totalComplaints: complaints.totalComplaints,
                                                totalCases: cases.totalCases,
                                                totalOfficers: officers.totalOfficers,
                                                totalArrests: arrests.totalArrests,
                                                activities
                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});

app.get("/change-password", (req, res) => {
    res.render("change-password");
});

app.post("/change-password", (req, res) => {

    const {
        currentPassword,
        newPassword,
        confirmPassword
    } = req.body;

    if (newPassword !== confirmPassword) {
        return res.send("New passwords do not match.");
    }

    db.get(
        "SELECT * FROM users WHERE username='admin' AND password=?",
        [currentPassword],
        (err, user) => {

            if (err) {
                return res.send("Database error");
            }

            if (!user) {
                return res.send("Current password is incorrect.");
            }

            db.run(
                "UPDATE users SET password=? WHERE username='admin'",
                [newPassword],
                (err) => {

                    if (err) {
                        return res.send("Database error");
                    }

                    db.run(
                       "INSERT INTO activities(activity, officer) VALUES(?, ?)",
                        ["Administrator changed password", "admin"]
                    );

                    req.session.destroy(() => {

    res.send(`
<!DOCTYPE html>
<html>
<head>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

</head>

<body>

<script>

Swal.fire({

    icon: 'success',

    title: 'Password Changed Successfully',

    text: 'Redirecting to login...',

    timer: 2000,

    timerProgressBar: true,

    showConfirmButton: false

});

setTimeout(() => {

    window.location = "/login";

}, 2000);

</script>

</body>
</html>
 `);

                    });

                }   // closes db.run callback
            );      // closes db.run

        }           // closes db.get callback
    );              // closes db.get

});                 // closes app.post


// app.get("/arrests/:id", (req, res) => {

    app.get("/arrests/:id", (req, res) => {

    const id = req.params.id;

    db.get(
        "SELECT * FROM arrests WHERE id = ?",
        [id],
        (err, arrest) => {

            if (err || !arrest) {
                return res.send("Arrest not found");
            }

            res.render("arrest-profile", {
                arrest
            });

        }
    );

});

app.get("/arrests/edit/:id", (req, res) => {

    const id = req.params.id;

    db.get(
        "SELECT * FROM arrests WHERE id = ?",
        [id],
        (err, arrest) => {

            if (err || !arrest) {
                return res.send("Arrest not found");
            }

            db.all(
                "SELECT case_number FROM cases ORDER BY id DESC",
                [],
                (err, cases) => {

                    if (err) {
                        return res.send("Database error");
                    }

                    db.all(
                        "SELECT full_name FROM officers ORDER BY full_name",
                        [],
                        (err, officers) => {

                            if (err) {
                                return res.send("Database error");
                            }

                            res.render("edit-arrest", {
                                arrest,
                                cases,
                                officers
                            });

                        }
                    );

                }
            );

        }
    );

});
app.post("/arrests/update/:id", (req, res) => {

    const id = req.params.id;

    const {
        suspect_name,
        national_id,
        gender,
        age,
        phone,
        address,
        offence,
        case_number,
        arrest_date,
        arrest_time,
        arrest_location,
        arresting_officer,
        cell_number,
        remarks
    } = req.body;

    db.run(
        `UPDATE arrests
        SET
            suspect_name = ?,
            national_id = ?,
            gender = ?,
            age = ?,
            phone = ?,
            address = ?,
            offence = ?,
            case_number = ?,
            arrest_date = ?,
            arrest_time = ?,
            arrest_location = ?,
            arresting_officer = ?,
            cell_number = ?,
            remarks = ?
        WHERE id = ?`,
        [
            suspect_name,
            national_id,
            gender,
            age,
            phone,
            address,
            offence,
            case_number,
            arrest_date,
            arrest_time,
            arrest_location,
            arresting_officer,
            cell_number,
            remarks,
            id
        ],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/arrests");

        }
    );

});

app.get("/arrests/delete/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "DELETE FROM arrests WHERE id = ?",
        [id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/arrests");

        }
    );

});

app.get("/visitors/new", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const visitorNumber =
        "KPS-VIS-" +
        new Date().getFullYear() +
        "-" +
        Date.now();

    db.all(
        "SELECT full_name FROM officers ORDER BY full_name",
        [],
        (err, officers) => {

            if (err) {
                return res.send("Database error");
            }

            db.all(
                "SELECT suspect_name FROM arrests ORDER BY suspect_name",
                [],
                (err, prisoners) => {

                    if (err) {
                        return res.send("Database error");
                    }

                    res.render("new-visitor", {
                        visitorNumber,
                        officers,
                        prisoners
                    });

                }
            );

        }
    );

});

app.get("/visitors", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.all(
        "SELECT * FROM visitors ORDER BY id DESC",
        [],
        (err, visitors) => {

            if (err) {
                return res.send("Database error");
            }

            res.render("visitors", {
                visitors
            });

        }
    );

});

app.post("/visitors", (req, res) => {

    const {
        visitor_number,
        full_name,
        national_id,
        phone,
        gender,
        address,
        person_to_visit,
        purpose,
        date,
        time_in,
        time_out,
        remarks
    } = req.body;

    db.run(
        `INSERT INTO visitors
        (
            visitor_number,
            full_name,
            national_id,
            phone,
            gender,
            address,
            person_to_visit,
            purpose,
            date,
            time_in,
            time_out,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            visitor_number,
            full_name,
            national_id,
            phone,
            gender,
            address,
            person_to_visit,
            purpose,
            date,
            time_in,
            time_out,
            remarks
        ],
        (err) => {

            if (err) {
                console.log(err);
                return res.send(err.message);
            }

            res.redirect("/visitors");
logActivity(
    "Visitor registered: " + full_name,
    req.session.user.username
);
        }
    );

});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/complaints", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("complaints");
});
app.post("/complaints", (req, res) => {
    const { name, phone, complaint } = req.body;

    db.run(
        `INSERT INTO complaints(name, phone, complaint)
         VALUES(?, ?, ?)`,
        [name, phone, complaint],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Error saving complaint");
            }

            res.redirect("/view-complaints");
            logActivity(
    "New complaint registered by " + name,
    req.session.user.username
);
        }
    );
});

app.get("/view-complaints", (req, res) => {
    db.all(
        "SELECT * FROM complaints ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.send("Database error");
            }

            res.render("view-complaints", {
                complaints: rows
            });
        }
    );
});

// Edit complaint page
app.get("/complaints/edit/:id", (req, res) => {
    const id = req.params.id;

    db.get(
        "SELECT * FROM complaints WHERE id = ?",
        [id],
        (err, row) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (!row) {
                return res.send("Complaint not found");
            }

            res.render("edit-complaint", {
                complaint: row
            });
        }
    );
});

// Update complaint
app.post("/complaints/update/:id", (req, res) => {
    const id = req.params.id;
    const { name, phone, complaint } = req.body;

    db.run(
        `UPDATE complaints
         SET name = ?, phone = ?, complaint = ?
         WHERE id = ?`,
        [name, phone, complaint, id],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/view-complaints");
        }
    );
});

app.get("/officers/delete/:id", (req, res) => {
    const id = req.params.id;

    db.run(
        "DELETE FROM officers WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                return res.send("Database error");
            }

            res.redirect("/officers");
        }
    );
});

// Delete complaint
app.get("/complaints/delete/:id", (req, res) => {
    const id = req.params.id;

    db.run(
        "DELETE FROM complaints WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/view-complaints");
        }
    );
});
app.get("/cases", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.all(
        "SELECT * FROM cases ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.send("Database error");
            }

            res.render("cases", {
                cases: rows
            });
        }
    );
});

app.get("/cases/new", (req, res) => {
    db.all(
        "SELECT * FROM officers ORDER BY full_name",
        [],
        (err, officers) => {
            if (err) {
                return res.send("Database error");
            }

            res.render("new-case", {
                officers: officers
            });
        }
    );
});

app.post("/cases", (req, res) => {
    const {
        complainant_name,
        case_title,
        description,
        officer
    } = req.body;

    const caseNumber =
        "KPS-" +
        new Date().getFullYear() +
        "-" +
        Date.now();

    db.run(
        `INSERT INTO cases
        (case_number,
         complainant_name,
         case_title,
         description,
         officer)
         VALUES (?, ?, ?, ?, ?)`,
        [
            caseNumber,
            complainant_name,
            case_title,
            description,
            officer
        ],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Error creating case");
            }

            res.redirect("/cases");
            logActivity(
    "New case opened: " + caseNumber,
    req.session.user.username
);
        }
    );
});

// Edit case page
app.get("/cases/edit/:id", (req, res) => {
    const id = req.params.id;

    db.get(
        "SELECT * FROM cases WHERE id = ?",
        [id],
        (err, row) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            if (!row) {
                return res.send("Case not found");
            }

            db.all(
                "SELECT * FROM officers ORDER BY full_name",
                [],
                (err, officers) => {
                    if (err) {
                        return res.send("Database error");
                    }

                    res.render("edit-case", {
                        policeCase: row,
                        officers: officers
                    });
                }
            );
        }
    );
});

// Update case
app.post("/cases/update/:id", (req, res) => {
    const id = req.params.id;

    const {
        complainant_name,
        case_title,
        description,
        officer,
        status
    } = req.body;

    db.run(
        `UPDATE cases
         SET complainant_name = ?,
             case_title = ?,
             description = ?,
             officer = ?,
             status = ?
         WHERE id = ?`,
        [
            complainant_name,
            case_title,
            description,
            officer,
            status,
            id
        ],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/cases");
        }
    );
});

// Delete case
app.get("/cases/delete/:id", (req, res) => {
    const id = req.params.id;

    db.run(
        "DELETE FROM cases WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/cases");
        }
    );
});

app.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});