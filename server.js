const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Database connection
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

// nodemailer
const transporterService = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'therapistapp25@gmail.com', 
        pass: 'ecelafdapwsxwwhi'  
    }
});

// Booking endpoint
app.post('/book', (req, res) => {
    const { fname, lname, email, date, time } = req.body;
    const sql = 'INSERT INTO bookings (firstname, lastname, email, date, time) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [fname, lname, email, date, time], (err) => {
        if (err) {
            console.error('Error saving booking:', err);
            return res.status(500).send('Error saving booking.');
        }
        
        // Send confirmation email
        const mail = {
            from: 'therapistapp25@gmail.com',
            to: email,
            subject: 'Booking Confirmation and Remainder',
            text: `Dear ${fname} ${lname},\n\nYour appointment has been booked successfully. Here are the details for remainder to your appointment!\n\nDate: ${date}\nTime: ${time}\n\nSee you soon!`
        };

        transporterService.sendMail(mail, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Booking successful, but failed to send confirmation email.');
            }
            res.status(200).send('Appointment booked successfully! Confirmation email sent.');
        });
    });
});

// Endpoint for canceling bookings
app.post('/cancel', (req, res) => {
    const { email, time, date } = req.body;
    const fetchBookedSqlAppointments = 'SELECT firstname, lastname FROM bookings WHERE email = ? AND time = ? AND date = ?';
    
    db.query(fetchBookedSqlAppointments, [email, time, date], (err, results) => {
        if (err) {
            console.error('Error fetching booking:', err);
            return res.status(500).send('There was an error while fetching the booking.');
        }

        if (results.length === 0) {
            return res.status(404).send('No booking was found for the given details.');
        }

        const { firstname, lastname } = results[0];

        const insertCanceledSqlAppointments = 'INSERT INTO canceled_bookings (firstname, lastname, email, date, time) VALUES (?, ?, ?, ?, ?)';
        
        db.query(insertCanceledSqlAppointments, [firstname, lastname, email, date, time], (err) => {
            if (err) {
                console.error('Error saving canceled booking:', err);
                return res.status(500).send('There was an error saving the canceled booking.');
            }

            const deleteBookedSqlAppointments = 'DELETE FROM bookings WHERE email = ? AND time = ? AND date = ?';
            db.query(deleteBookedSqlAppointments, [email, time, date], (err) => {
                if (err) {
                    console.error('Error deleting booking:', err);
                    return res.status(500).send('There was an error deleting the booking.');
                }

                res.status(200).send('Booking canceled successfully!');
            });
        });
    });
});

// Endpoint for logging in
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error checking credentials.');
        }
  
        if (results.length > 0) {
            const bookedSqlAppointments = 'SELECT firstname, lastname, date, time FROM bookings';
            const canceledSqlAppointments = 'SELECT firstname, lastname, date, time FROM canceled_bookings';

            db.query(bookedSqlAppointments, (err, booked) => {
                if (err) {
                    return res.status(500).send('Error fetching booked appointments.');
                }

                db.query(canceledSqlAppointments, (err, canceled) => {
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