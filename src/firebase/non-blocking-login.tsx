'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  FirebaseError,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

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

function handleAuthError(error: FirebaseError) {
    console.error("Social Sign-In Error:", error);
    let description = "An unexpected error occurred during sign-in. Please try again.";

    // Check for common, user-actionable errors
    if (error.code === 'auth/popup-closed-by-user') {
        description = "The sign-in window was closed. Please try again.";
    } else if (error.code === 'auth/cancelled-popup-request') {
        description = "Sign-in was cancelled. Please try again.";
    } else if (error.code === 'auth/popup-blocked') {
        description = "The sign-in pop-up was blocked by your browser. Please allow pop-ups and try again.";
    } else if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-allowed') {
        description = "This sign-in method is not enabled. Please contact the administrator.";
    }
    
    toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: description,
    });
}


/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    handleAuthError(error);
  });
}

/** Initiate Facebook sign-in (non-blocking). */
export function initiateFacebookSignIn(authInstance: Auth): void {
  const provider = new FacebookAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    handleAuthError(error);
  });
}
