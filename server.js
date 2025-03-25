const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// database booking_db connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'rootpassword', 
    database: 'booking_db' 
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Endpoint  booking
app.post('/book', (req, res) => {
    const { fname, lname, email, date, time } = req.body;
    const sql = 'INSERT INTO bookings (firstname, lastname, email, date, time) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [fname, lname, email, date, time], (err) => {
        if (err) {
            console.error('Error saving booking:', err);
            return res.status(500).send('Error saving booking.');
        }
        res.status(200).send('Appointment booked successfully!');
    });
});

// Endpoint cancelling 
app.post('/cancel', (req, res) => {
    const { email, time, date } = req.body;
    const fetchBookingSql = 'SELECT firstname, lastname FROM bookings WHERE email = ? AND time = ? AND date = ?';
    
    db.query(fetchBookingSql, [email, time, date], (err, results) => {
        if (err) {
            console.error('Error fetching booking:', err);
            return res.status(500).send('There was an error while fetching the booking.');
        }

        if (results.length === 0) {
            return res.status(404).send('No booking was found for the given details.');
        }

        const { firstname, lastname } = results[0];

        const insertCanceledSql = 'INSERT INTO canceled_bookings (firstname, lastname, email, date, time) VALUES (?, ?, ?, ?, ?)';
        
        db.query(insertCanceledSql, [firstname, lastname, email, date, time], (err) => {
            if (err) {
                console.error('Error saving canceled booking:', err);
                return res.status(500).send('There was an error saving the canceled booking.');
            }

            const deleteBookingSql = 'DELETE FROM bookings WHERE email = ? AND time = ? AND date = ?';
            db.query(deleteBookingSql, [email, time, date], (err) => {
                if (err) {
                    console.error('Error deleting booking:', err);
                    return res.status(500).send('there was an error deleting the booking.');
                }

                res.status(200).send('Booking canceled successfully!');
            });
        });
    });
});

// Endpoint  login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error checking credentials.');
        }
   //I need to change that html portal stuff too and put sth generic like hey
        if (results.length > 0) {
            const bookedSql = 'SELECT firstname, lastname, date, time FROM bookings';
            const canceledSql = 'SELECT firstname, lastname, date, time FROM canceled_bookings';

            db.query(bookedSql, (err, booked) => {
                if (err) {
                    return res.status(500).send('Error fetching booked appointments.');
                }

                db.query(canceledSql, (err, canceled) => {
                    if (err) {
                        return res.status(500).send('Error fetching canceled appointments.');
                    }

                    res.json({ booked, canceled });
                });
            });
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});