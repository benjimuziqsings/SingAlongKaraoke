'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate email/password sign-up (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    // Handle Errors here.
    console.error("Google Sign-In Error:", error);
  });
}

/** Initiate Facebook sign-in (non-blocking). */
export function initiateFacebookSignIn(authInstance: Auth): void {
  const provider = new FacebookAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    // Handle Errors here.
    console.error("Facebook Sign-In Error:", error);
  });
}
