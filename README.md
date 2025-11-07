# Sing A Long Karaoke

This is a Next.js application built for Firebase Studio that allows karaoke bar patrons to submit song requests and a Karaoke Jockey (KJ) to manage the song queue in real time.

This application is configured for deployment on **Firebase App Hosting**.

## Production Deployment

This application is set up for a streamlined "Git-based" deployment with Firebase App Hosting.

1.  **Connect to GitHub:** In the Firebase console, connect your project to a GitHub repository.
2.  **Push to Deploy:** Once connected, every `git push` to your `main` branch will automatically trigger a build and deployment of your application.

No service account keys or manual configuration files are needed for production deployment.

## Local Development Setup

To run this application on your local machine for development, you will need to authenticate to Firebase.

1.  **Create a Firebase Project:** If you haven't already, create a project in the [Firebase Console](https://console.firebase.google.com/). The necessary configuration to connect your app is already handled by Firebase App Hosting.

2.  **Log in with the Firebase CLI:** To give your local app the credentials it needs, you will authenticate using the Firebase Command Line Interface (CLI).
    *   Install the Firebase CLI by following the instructions [here](https://firebase.google.com/docs/cli#install).
    *   Log in to your Google account by running:
        ```bash
        firebase login
        ```

3.  **Run the Application:** Once you are logged in, you can start the local development server:
    ```bash
    npm run dev
    ```
    The application will now run locally and connect to your Firebase project using your CLI credentials.

## Setting the First Karaoke Jockey (KJ)

To access the admin dashboard, at least one user must be assigned the "KJ" role. This is done using a **custom claim** on the user's account. This must be done from a trusted backend environment.

You can use the Firebase CLI to set a custom claim.

1.  **Get the User's UID:** Find the UID of the user you want to make a KJ from the Firebase Console under **Authentication > Users**.
2.  **Run the CLI command:**
    ```bash
    firebase auth:set-claims <user-uid> --claims=isKJ=true
    ```
    For example:
    ```bash
    firebase auth:set-claims A1b2C3d4e5... --claims=isKJ=true
    ```
The user will have admin privileges on their next sign-in.
