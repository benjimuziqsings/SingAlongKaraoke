# Sing A Long Karaoke

This is a Next.js application built for Firebase Studio that allows karaoke bar patrons to submit song requests and a Karaoke Jockey (KJ) to manage the song queue in real time.

This application is configured for deployment on **Firebase App Hosting**.

## Production Deployment

This application is set up for a streamlined "Git-based" deployment with Firebase App Hosting.

1.  **Connect to GitHub:** In the Firebase console, connect your project to a GitHub repository.
2.  **Push to Deploy:** Once connected, every `git push` to your `main` branch will automatically trigger a build and deployment of your application.

No service account keys or manual configuration files are needed for production deployment.

## Configuring Sign-In Methods

To enable users to sign in with Google, you must configure this provider in the Firebase Console.

### Enable Google Sign-In

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Authentication** > **Sign-in method**.
3.  Click on **Google** from the list of providers.
4.  **Enable** the provider.
5.  For the **Project public-facing name**, select your project's public name.
6.  For **Project support email**, select your email address.
7.  Click **Save**. Google Sign-In should now be active.

## Setting the First Karaoke Jockey (KJ)

To access the admin dashboard, at least one user must be assigned the "KJ" role. Your account (`benjimuziqsings@gmail.com`) is already hardcoded as an admin.

If you need to grant KJ privileges to another user, you can do so by setting a **custom claim** on their account. This must be done from a trusted backend environment, like the Firebase CLI.

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
