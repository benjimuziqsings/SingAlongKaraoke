import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: any;
const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceKey) {
  const apps = getApps();
  const firebaseApp = apps.length === 0 ? initializeApp({
      credential: cert(JSON.parse(serviceKey))
  }) : apps[0];
  db = getFirestore(firebaseApp);
} else {
  console.warn(`
    ****************************************************************
    *** FIREBASE_SERVICE_ACCOUNT_KEY is not set.                 ***
    *** Firestore functionality will be disabled.                ***
    *** Please follow the instructions in the README.md to set it up. ***
    ****************************************************************
  `);
  // Use a mock db object if the service key is not set
  db = {
    collection: () => ({
      get: () => Promise.resolve({ docs: [] }),
      add: () => Promise.resolve(),
      doc: () => ({
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        collection: () => ({
            get: () => Promise.resolve({ docs: [] }),
            add: () => Promise.resolve(),
        })
      }),
    }),
    batch: () => ({
        delete: () => {},
        commit: () => Promise.resolve(),
    }),
    writeBatch: () => ({
        delete: () => {},
        commit: () => Promise.resolve(),
    }),
  };
}


export { db };
