const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
const port = 3002;

const pool = new Pool({
    host: 'appointmentdb.cjs8244wiiun.ap-southeast-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Maleesha_test',
    database: 'appointmentdb',
    ssl: {
      rejectUnauthorized: false,  // This might need to be set depending on your SSL setup
    },
  });

app.use(express.json());

app.post('/add_appointment', async (req, res) => {
    const { appointment_id,doctor_name, appointment_date, appointment_time,patient_id} = req.body;

    try {


        const result2 = await pool.query(
            'INSERT INTO appointment(appointment_id,doctor_name, appointment_date, appointment_time,patient_id) VALUES ($1, $2, $3, $4, $5)',
            [appointment_id,doctor_name, appointment_date, appointment_time,patient_id]
        );
        res.status(201).json({ message: 'Appointment added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.put('/update_appointment/:appointment_id', async (req, res) => {
    const { appointment_id} = req.params;
    const { doctor_name, appointment_date, appointment_time,patient_id} = req.body;

    try {


        const result1 = await pool.query(
            'UPDATE appointment SET doctor_name = $1, appointment_date = $2, appointment_time = $3, patient_id= $4 WHERE appointment_id = $5',
            [doctor_name, appointment_date, appointment_time,patient_id,appointment_id]
        );
        
        if (result1.rowCount === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.status(200).json({ message: 'Appointment updated successfully' });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete('/delete_appointment/:appointment_id', async (req, res) => {
    const { appointment_id} = req.params;
    

    try {

        const result3 = await pool.query('DELETE FROM appointment WHERE appointment_id = $1', [ appointment_id]);

        if (result3.rowCount === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.status(200).json({ message: 'Appointment deleted successfully' });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});


app.get('/get_appointment', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointment');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/get_appointment/:appointment_id', async (req, res) => {
    const { appointment_id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM appointment WHERE appointment_id = $1', [appointment_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Appointment scheduling Service running on http://localhost:${port}`);
  });
