const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
//const port = 3001;

const pool = new Pool({
  host: 'patientdb.cjs8244wiiun.ap-southeast-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Maleesha_test',
  database: 'patientdb',
  ssl: {
    rejectUnauthorized: false,  // This might need to be set depending on your SSL setup
  },
});

app.use(bodyParser.json());

app.post('/add_patient', async (req, res) => {
      const { patient_id,patient_name, age, phone_no, medicine, lab_result, symptoms, doctor_name, speciality, treatment } = req.body;
 
  try {


        const result2 = await pool.query(
            'INSERT INTO patient(patient_id,patient_name, age, phone_no, medicine, lab_result, symptoms, doctor_name, speciality, treatment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [patient_id,patient_name, age, phone_no, medicine, lab_result, symptoms, doctor_name, speciality, treatment]
        );
        res.status(201).json({ message: 'Patient record added successfully' });
  } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.put('/update_patient/:patient_id', async (req, res) => {
  const { patient_id} = req.params;
  const { patient_name, age, phone_no, medicine, lab_result, symptoms, doctor_name, speciality, treatment} = req.body;

  try {


      const result1 = await pool.query(
          'UPDATE patient SET patient_name = $1, age = $2, phone_no = $3, medicine= $4, lab_result=$5, symptoms=$6, doctor_name=$7, speciality=$8, treatment=$9  WHERE patient_id = $10',
          [patient_name, age, phone_no, medicine, lab_result, symptoms, doctor_name, speciality, treatment,patient_id]
      );
      
      if (result1.rowCount === 0) {
          return res.status(404).json({ error: 'Patient not found' });
      }

      res.status(200).json({ message: 'Patient updated successfully' });
      
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.delete('/delete_patient/:patient_id', async (req, res) => {
  const { patient_id} = req.params;
  

  try {

      const result3 = await pool.query('DELETE FROM patient WHERE patient_id = $1', [ patient_id]);

      if (result3.rowCount === 0) {
          return res.status(404).json({ error: 'patient not found' });
      }

      res.status(200).json({ message: 'patient deleted successfully' });
      
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }

});


app.get('/get_patient', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM patient');
      res.status(200).json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get_patient/:patient_id', async (req, res) => {
  const { patient_id } = req.params;

  try {
      const result = await pool.query('SELECT * FROM patient WHERE patient_id = $1', [patient_id]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'patient not found' });
      }

      res.status(200).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 3001;
app.listen(port, () => {
    console.log(`Patient Record Service running on http://localhost:${port}`);
    
  });
