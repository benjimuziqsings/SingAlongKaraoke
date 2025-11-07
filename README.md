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

## Configuring Sign-In Methods

To enable users to sign in with Google and Facebook, you must configure these providers in the Firebase Console.

### Enable Google Sign-In

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Authentication** > **Sign-in method**.
3.  Click on **Google** from the list of providers.
4.  **Enable** the provider.
5.  For the **Project public-facing name**, select your project's public name.
6.  For **Project support email**, select your email address.
7.  Click **Save**. Google Sign-In should now be active.

### Enable Facebook Sign-In

1.  Go to the [Facebook for Developers](https://developers.facebook.com/) website and create a new app.
2.  From the app dashboard, go to **Settings > Basic**. You will need your **App ID** and **App Secret**.
3.  Go back to the [Firebase Console](https://console.firebase.google.com/) > **Authentication** > **Sign-in method**.
4.  Click on **Facebook**.
5.  **Enable** the provider.
6.  Enter the **App ID** and **App Secret** you got from the Facebook Developer dashboard.
7.  Firebase will give you an **OAuth redirect URI** (it will look something like `https://<your-project-id>.firebaseapp.com/__/auth/handler`). Copy this URI.
8.  Go back to your Facebook App's dashboard. Under **Products**, add **Facebook Login** and go to its **Settings**.
9.  In the **Valid OAuth Redirect URIs** field, paste the URI you copied from Firebase.
10. Click **Save Changes**. Facebook Sign-In should now be active.

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
