const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const app = express();
const port = 3001;



const secretsManager = new SecretsManagerClient({
  region: 'ap-southeast-1',
});

async function getDbCredentials() {
  const secretName = 'patinet_db_secret_key';
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const data = await secretsManager.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return secret;
	  console.log("Patient Record Service is running on port " + secret);
    }
  } catch (err) {
    console.error("Error retrieving secret from Secrets Manager:", err);
    throw new Error("Could not retrieve database credentials from Secrets Manager.");
  }
}


async function createDbPool() {
  try {
    const dbCredentials = await getDbCredentials();
    const pool = new Pool({
      host: dbCredentials.host,
      port: dbCredentials.port,
      user: dbCredentials.user,
      password: dbCredentials.password,
      database: dbCredentials.database,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    return pool;
  } catch (error) {
    console.error("Error initializing database pool:", error);
    process.exit(1); 
  }
}


app.use(bodyParser.json());


// user Authentication
const userSecret = 'Malee1234';

app.use((req, res, next) => {
  const enteredSecret = req.headers['secretpassword'];
 
  if (!enteredSecret || enteredSecret !== userSecret) {
    return res.status(403).json({ error: "Forbidden: Invalid or missing secret password" });
  }
 
  next();
});


let pool;

async function startServer() {
  pool = await createDbPool(); 

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


app.listen(port, () => {
    console.log(`Patient Record Service running on http://localhost:${port}`);
    
  });

}

startServer().catch((error) => {
  console.error("Error starting the server:", error);
  process.exit(1);
});