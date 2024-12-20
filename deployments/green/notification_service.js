const { Pool } = require('pg');
const moment = require('moment');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const express = require('express');


//patientdb secret manager fetch
const secretsManager = new SecretsManagerClient({
  region: 'ap-southeast-1',
});

async function getDbCredentialsPatient() {
  const secretName = 'patinet_db_secret_key';
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const data = await secretsManager.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return secret;
    }
  } catch (err) {
    console.error("Error retrieving secret from Secrets Manager:", err);
    throw new Error("Could not retrieve database credentials from Secrets Manager.");
  }
}

async function patientDbPool() {
  try {
    const dbCredentials = await getDbCredentialsPatient();
    const patientdb = new Pool({
      host: dbCredentials.host,
      port: dbCredentials.port,
      user: dbCredentials.user,
      password: dbCredentials.password,
      database: dbCredentials.database,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    return patientdb;
  } catch (error) {
    console.error("Error initializing patient database pool:", error);
    process.exit(1); 
  }
}

//appointmentdb secret manager fetch
async function getDbCredentialsAppointment() {
  const secretName = 'appointment_db_secret_key';
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const data = await secretsManager.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return secret;
    }
  } catch (err) {
    console.error("Error retrieving secret from Secrets Manager:", err);
    throw new Error("Could not retrieve database credentials from Secrets Manager.");
  }
}


async function appointmentDbPool() {
  try {
    const dbCredentials = await getDbCredentialsAppointment();
    const appointmentdb = new Pool({
      host: dbCredentials.host,
      port: dbCredentials.port,
      user: dbCredentials.user,
      password: dbCredentials.password,
      database: dbCredentials.database,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    return appointmentdb;
  } catch (error) {
    console.error("Error initializing patient appointment database pool:", error);
    process.exit(1); 
  }
}



async function generateReminders() {
    const patientdb = await patientDbPool();
    const appointmentdb = await appointmentDbPool();
  try {

    // Get the current date in Sri Lanka time zone (UTC+5:30)
    const currentDateSriLanka = moment().format('YYYY-MM-DD');
   console.log(currentDateSriLanka);
    // Fetch appointments from the appointment database

    const result_output = await appointmentdb.query(`SELECT appointment_id,doctor_name, appointment_date, appointment_time,patient_id 
      FROM appointment  WHERE DATE_TRUNC('DAY',appointment_date) = $1`, [currentDateSriLanka]);
    const appointments = result_output.rows;

    // Fetch patients from the patient database
    const patientQuery = `
      SELECT 
        patient_id, patient_name, phone_no 
      FROM 
        patient
    `;
    const patientResult = await patientdb.query(patientQuery);
    const patients = patientResult.rows;

    // Join data programmatically
    const notifications = appointments.map(appointment => {
      const patient = patients.find(p => p.patient_id === appointment.patient_id);
      if (patient) {
        return {
          appointment_id: appointment.appointment_id,
          doctor_name: appointment.doctor_name,
          appointment_date: appointment.appointment_date.toLocaleDateString('en-CA'),
          appointment_time: appointment.appointment_time,
          patient_name: patient.patient_name,
          phone_no: patient.phone_no,
        };
      }
      return null;
    }).filter(notification => notification !== null);

    console.log('Generated Notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Error generating notifications:', error);
    return [];
  } finally {
    // Close all database connections
    appointmentdb.end();
    patientdb.end();
  }
}

// Create the HTTP server
const app = express();

// Route to handle GET requests and return notifications
app.get('/notifications', async (req, res) => {
  try {
    const notifications = await generateReminders();
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Start the server
const port = 3004; // Change the port if needed
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
