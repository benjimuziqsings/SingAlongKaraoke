# Sing A Long Karaoke

This is a Next.js application built for Firebase Studio that allows karaoke bar patrons to submit song requests and a Karaoke Jockey (KJ) to manage the song queue in real time.

This application is configured for deployment on **Firebase App Hosting**.

## Production Checklist

Your app is deployed, but to be fully "production-ready," follow these steps:

### 1. Configure Stripe for Payments

To enable the tipping feature, you must add your Stripe API keys to Firebase as secrets.

1.  **Get Stripe Keys:**
    *   Sign up or log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
    *   Go to the **Developers** > **API keys** section.
    *   Find your **Publishable key** (starts with `pk_...`) and your **Secret key** (starts with `sk_...`).

2.  **Add Keys to Firebase App Hosting:**
    *   Go to your [Firebase Console](https://console.firebase.google.com/).
    *   Navigate to the **App Hosting** section and select your backend.
    *   Under the **Settings** tab, add the following two secrets:
        *   **Secret name:** `STRIPE_SECRET_KEY`, **Secret value:** Paste your Stripe Secret key.
        *   **Secret name:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, **Secret value:** Paste your Stripe Publishable key.
    *   After adding the secrets, App Hosting will automatically trigger a new rollout to apply them.

### 2. Connect a Custom Domain

For a professional URL, connect a custom domain.

1.  In the Firebase **App Hosting** dashboard, click **"Add custom domain"**.
2.  Follow the instructions to verify ownership of your domain and point your DNS records to Firebase.

### 3. Add Songs to Your Catalog

Your karaoke catalog is currently empty. You can manage it from the KJ Dashboard.

1.  **Log in** to your deployed application.
2.  Navigate to the **KJ View** > **Catalog Management** tab.
3.  Use the **"Add Artist"** and **"Add Song"** buttons to build your catalog manually.
4.  **Alternatively, use the "Import from CSV"** feature to upload your entire song list at once. The CSV file must have three columns: `Artist`, `Song`, and `Lyrics`.

### 4. Secure Admin Access

Your email (`benjimuziqsings@gmail.com`) is hardcoded as an admin. For better security, it's recommended to rely on custom claims.

1.  **Get the User's UID:** Find the UID of the user you want to make a KJ from the Firebase Console under **Authentication > Users**.
2.  **Run the Firebase CLI command:**
    ```bash
    firebase auth:set-claims <user-uid> --claims=isKJ=true
    ```
    For example:
    ```bash
    firebase auth:set-claims A1b2C3d4e5... --claims=isKJ=true
    ```
The user will have admin privileges on their next sign-in.

---

## Production Deployment

This application is set up for a streamlined "Git-based" deployment with Firebase App Hosting.

1.  **Connect to GitHub:** In the Firebase console, connect your project to a GitHub repository.
2.  **Push to Deploy:** Once connected, every `git push` to your `main` branch will automatically trigger a build and deployment of your application.

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
