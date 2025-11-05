
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: any;
const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceKey) {
  try {
    const apps = getApps();
    const firebaseApp = apps.length === 0 ? initializeApp({
        credential: cert(JSON.parse(serviceKey))
    }) : apps[0];
    db = getFirestore(firebaseApp);
  } catch (error: any) {
      console.error(`
      ****************************************************************
      *** ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY.   ***
      *** Please make sure you have copied the entire JSON object ***
      *** from your service account file into the .env file.      ***
      *** It should start with '{' and end with '}'.              ***
      ***                                                         ***
      *** Parser error: ${error.message}                          ***
      ****************************************************************
    `);
    db = null; // Set db to null on error
  }
} else {
  console.warn(`
    ****************************************************************
    *** FIREBASE_SERVICE_ACCOUNT_KEY is not set.                 ***
    *** Firestore functionality will be disabled.                ***
    *** Please follow the instructions in the README.md to set it up. ***
    ****************************************************************
  `);
  db = null; // Set db to null if key is not set
}

export { db };
