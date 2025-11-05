# Sing A Long Karaoke

This is a NextJS starter in Firebase Studio.

This application allows karaoke bar patrons to submit song requests and a Karaoke Jockey (KJ) to manage the song queue in real time.

## Firebase Setup

This project uses Firebase for its database. To run this application, you will need to create a Firebase project and configure a service account.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Firestore:** In your new project, go to the "Firestore Database" section and create a database. Start in **test mode** for now.
3.  **Create a Service Account:**
    *   In your Firebase project, go to **Project settings** > **Service accounts**.
    *   Click **Generate new private key**. A JSON file will be downloaded.
4.  **Set Environment Variable:**
    *   Open the `.env` file in the root of this project.
    *   Copy the entire content of the downloaded JSON file and paste it as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`.
    *   It should look like this: `FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", ...}`
5.  **Import Initial Data (Optional):**
    *   The file `src/lib/karaoke-catalog-seed.json` contains sample data.
    *   You can use the "Import data" feature in the Firestore console to import this data into your `artists` collection to get started quickly.

Once these steps are complete, you can run the application, and it will connect to your Firestore database.
