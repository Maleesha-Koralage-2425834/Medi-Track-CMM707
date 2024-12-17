const { Pool,Client } = require('pg');


const analyticsdb = new Client({
  connectionString: 'postgresql://admin:ESJOEooqep228&%@meditech.794038257645.ap-southeast-1.redshift-serverless.amazonaws.com:5439/dev',
  ssl: {
    rejectUnauthorized: false, 
  },
});


analyticsdb.connect().then(() => console.log("REDSHIFT CONNECTION SUCESS"))

const appointmentdb = new Pool({
    host: 'appointmentdb.cjs8244wiiun.ap-southeast-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Maleesha_test',
    database: 'appointmentdb',
    ssl: {
      rejectUnauthorized: false, 
    },
  });


  const patientdb = new Pool({
    host: 'patientdb.cjs8244wiiun.ap-southeast-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'Maleesha_test',
    database: 'patientdb',
    ssl: {
      rejectUnauthorized: false,  
    },
  });


//The number of appointments per doctor
async function aggregate_1(){

  analyticsdb.query(
    'delete from analyticsdb.public.appointments_per_doctor;',
    
  );

  const query = `
      SELECT doctor_name, COUNT(*) AS total_appointments
      FROM appointment
      GROUP BY doctor_name;
    `;
    try {
      const result = await appointmentdb.query(query);
      result.rows.forEach(async(row,index) =>{
        
       const doctor_name= row.doctor_name 
       const count = row.total_appointments

       


        const result2 = await analyticsdb.query(
            'INSERT INTO analyticsdb.public.appointments_per_doctor(doctor_name, total_appointments) VALUES ($1, $2)',
            [doctor_name,count]
        );
       
        
       
      })
     
      console.log('Aggregate_1  function completed successfully!'); 

    }catch (err) {
            console.error(err);
            res.status(500).send("Error fetching insights");
    }
}


//The frequency of appointments over time.
async function aggregate_2(){

  analyticsdb.query(
    'delete from analyticsdb.public.appointments_frequency;',
    
  );

  const query = `
          SELECT 
            appointment_date, 
            COUNT(*) AS appointment_count
          FROM appointment
          GROUP BY appointment_date
          ORDER BY appointment_date;
          `;
    try {
      const result = await appointmentdb.query(query);
      result.rows.forEach(async(row,index) =>{
        
      const appointment_date= row.appointment_date 
      const appointment_count = row.appointment_count


      const result2 = await analyticsdb.query(
          'INSERT INTO analyticsdb.public.appointments_frequency(appointment_date, appointment_count) VALUES ($1, $2)',
          [appointment_date,appointment_count]
      );
       
       
       
      })
      
      console.log('Aggregate_2  function completed successfully!'); 
    }catch (err) {
            console.error(err);
            res.status(500).send("Error fetching insights");
    }
}


//Common symptoms and conditions treated, categorised by specialty
async function aggregate_3(){

  analyticsdb.query(
    'delete from analyticsdb.public.common_symptoms;',
    
  );

  const query = `
        SELECT  
            speciality,
            symptoms, 
            treatment,
            COUNT(*) AS occurrence
        FROM patient
        GROUP BY speciality, symptoms,treatment
        ORDER BY speciality, occurrence DESC;
  `;
    try {
      const result = await patientdb.query(query);
      result.rows.forEach(async(row,index) =>{
        
      const speciality= row.speciality 
      const symptoms = row.symptoms
      const treatment = row.treatment
      const occurrence = row.occurrence


      const result2 = await analyticsdb.query(
          'INSERT INTO analyticsdb.public.common_symptoms(speciality,symptoms, treatment,occurrence) VALUES ($1, $2, $3, $4)',
          [speciality,symptoms, treatment,occurrence]
      );
       
       
       
      })
      
      console.log('Aggregate_3  function completed successfully!'); 
    }catch (err) {
            console.error(err);
            res.status(500).send("Error fetching insights");
    }
}


//Common symptoms and conditions treated, categorised by specialty
async function aggregate_4(){

  analyticsdb.query(
    'delete from analyticsdb.public.patient_age_distribution;',
    
  );

  const query = `
        SELECT  
            patient_id,
            age
        FROM patient;
  `;
    try {
      const result = await patientdb.query(query);
      result.rows.forEach(async(row,index) =>{
        
      const patient_id= row.patient_id 
      const age = row.age



      const result2 = await analyticsdb.query(
          'INSERT INTO analyticsdb.public.patient_age_distribution(patient_id,age) VALUES ($1, $2)',
          [patient_id,age]
      );
       
       
       
      })
      
      console.log('Aggregate_4  function completed successfully!'); 
    }catch (err) {
            console.error(err);
            res.status(500).send("Error fetching insights");
    }
}

aggregate_1();
aggregate_2();
aggregate_3();
aggregate_4();




