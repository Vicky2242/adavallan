// This is a Node.js script to migrate data from CSV files into your Firestore database.
//
// HOW TO USE:
// 1. **Prerequisites**: Make sure you have Node.js installed on your machine.
// 2. **Install Dependencies**: Open your terminal in the project root folder and run:
//    npm install firebase-admin csv-parser
// 3. **Firebase Admin SDK Key**:
//    a. Go to your Firebase project settings -> Service accounts.
//    b. Click "Generate new private key" and download the JSON file.
//    c. **IMPORTANT**: Rename the downloaded file to `service-account-key.json` and place it inside the `src/scripts` folder.
//    d. **SECURITY NOTE**: Do NOT commit this key to a public repository. It provides admin access to your Firebase project.
// 4. **Prepare CSV Files**:
//    a. Convert your Customers.sql and Orders.sql files into `customers.csv` and `orders.csv`.
//    b. Place both CSV files inside the `src/scripts` folder.
// 5. **Run the Script**:
//    a. Open your terminal in the project root folder.
//    b. Run the command: node src/scripts/import-from-csv.js
//
// This script will read the CSV files, merge the customer and order data, and upload it to your 'registrations' collection in Firestore.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// --- CONFIGURATION ---
// IMPORTANT: Make sure these file paths and collection names are correct.
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'service-account-key.json');
const CUSTOMERS_CSV_PATH = path.join(__dirname, 'customers.csv');
const ORDERS_CSV_PATH = path.join(__dirname, 'orders.csv');
const TARGET_COLLECTION = 'registrations';

// --- INITIALIZE FIREBASE ADMIN SDK ---
try {
  const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('CRITICAL ERROR: Could not initialize Firebase Admin SDK.');
  console.error('Please ensure `service-account-key.json` exists in the `src/scripts` directory and is valid.');
  console.error('Error details:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// --- DATA PROCESSING FUNCTIONS ---

// Function to read a CSV file and return its data as a map
async function readCsvToMap(filePath, keyColumn) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found at: ${filePath}`));
    }
    const dataMap = new Map();
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row[keyColumn]) {
          dataMap.set(row[keyColumn], row);
        }
      })
      .on('end', () => {
        console.log(`Successfully parsed ${dataMap.size} records from ${path.basename(filePath)}.`);
        resolve(dataMap);
      })
      .on('error', (error) => reject(error));
  });
}

// --- MAIN MIGRATION LOGIC ---
async function migrateData() {
  console.log('Starting data migration...');

  try {
    // Read both CSV files into maps for easy lookup
    const customersMap = await readCsvToMap(CUSTOMERS_CSV_PATH, 'id');
    const ordersMap = await readCsvToMap(ORDERS_CSV_PATH, 'user_id');

    console.log(`Found ${customersMap.size} customers and ${ordersMap.size} orders.`);
    
    const batch = db.batch();
    let recordsToUpload = 0;

    customersMap.forEach((customer, customerId) => {
      const order = ordersMap.get(customerId);

      // Map SQL fields to your Firestore schema
      const newRegistrationRecord = {
        participantId: customer.reg_id || `MIG_${customerId}`,
        participantName: customer.participantName,
        fatherName: customer.fatherName,
        gender: customer.gender,
        dateOfBirth: customer.birthDate,
        email: customer.email,
        phoneNumber: customer.phone,
        address: customer.address,
        postalCode: customer.postalCode,
        state: customer.state,
        city: customer.city,
        country: customer.country,
        danceSchoolName: customer.teamInstitutionName,
        danceTeacher: customer.coordinatorName,
        photoLink: customer.photograph || null, // Assuming URLs are in the SQL dump
        idProofLink: customer.idProof || null,  // Assuming URLs are in the SQL dump
        registrationDate: customer.registrationDate ? admin.firestore.Timestamp.fromDate(new Date(customer.registrationDate)) : admin.firestore.FieldValue.serverTimestamp(),

        // Merged from Orders data
        paymentStatus: order ? (order.payment_status === '1' ? 'successful' : 'pending') : 'pending',
        orderId: order ? order.order_id : null,
        paymentId: order ? order.payment_id : null,
        paidAmount: order ? order.total_price : null,
        paidOn: order ? (order.created_at ? new Date(order.created_at).toISOString() : null) : null,
        createdAt: customer.registrationDate ? admin.firestore.Timestamp.fromDate(new Date(customer.registrationDate)) : admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Create a new document reference in the target collection
      const docRef = db.collection(TARGET_COLLECTION).doc();
      batch.set(docRef, newRegistrationRecord);
      recordsToUpload++;
    });

    if (recordsToUpload > 0) {
      console.log(`Committing ${recordsToUpload} records to Firestore...`);
      await batch.commit();
      console.log('✅ Data migration successful! All records have been uploaded.');
    } else {
      console.log('No new records to upload.');
    }

  } catch (error) {
    console.error('❌ An error occurred during the migration process:');
    console.error(error);
  }
}

migrateData();
