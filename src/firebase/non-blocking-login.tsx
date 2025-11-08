
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

function handleAuthError(error: any, context: 'sign-in' | 'sign-up' | 'social' | 'sign-out') {
    console.error(`${context} Error:`, error);
    
    // Check if it's a Firebase error by looking for the 'code' property
    if (typeof error === 'object' && error !== null && 'code' in error) {
        let title = 'Authentication Failed';
        let description = 'An unexpected error occurred. Please try again.';

        switch (error.code) {
            // Sign-in specific
            case 'auth/invalid-credential':
            case 'auth/invalid-email':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                title = 'Sign-In Failed';
                description = 'Invalid credentials. Please check your email and password and try again.';
                break;
            // Sign-up specific
            case 'auth/email-already-in-use':
                title = 'Registration Failed';
                description = 'An account with this email address already exists. Please sign in instead.';
                break;
            case 'auth/weak-password':
                title = 'Registration Failed';
                description = 'The password is too weak. Please choose a stronger password.';
                break;
            // Social / Popup specific
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                // Don't show a toast for this, as it's an intentional user action
                return;
            case 'auth/popup-blocked':
                title = 'Sign-In Failed';
                description = 'The sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
                break;
            // General / Shared
            case 'auth/unauthorized-domain':
            case 'auth/operation-not-allowed':
                title = 'Sign-In Not Enabled';
                description = 'This sign-in method is not enabled. Please contact support.';
                break;
            case 'auth/too-many-requests':
                title = 'Access Temporarily Disabled';
                description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
                break;
        }
        
        toast({
            variant: "destructive",
            title: title,
            description: description,
        });
    } else {
        // Handle generic errors that are not from Firebase
        toast({
            variant: "destructive",
            title: 'An Unexpected Error Occurred',
            description: 'Please try again.',
        });
    }
}


/** Initiate email/password sign-up (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    toast({
        title: 'Account Created!',
        description: "Welcome! You've been signed in.",
    });
  } catch (error: any) {
    handleAuthError(error, 'sign-up');
    // Re-throw to be caught by the component's try/catch if needed
    throw error;
  }
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
        // Success is handled by onAuthStateChanged redirecting the user
    })
    .catch((error: any) => {
        handleAuthError(error, 'sign-in');
    });
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    handleAuthError(error, 'social');
  });
}

/** Initiate Facebook sign-in (non-blocking). */
export function initiateFacebookSignIn(authInstance: Auth): void {
  const provider = new FacebookAuthProvider();
  signInWithPopup(authInstance, provider).catch(error => {
    handleAuthError(error, 'social');
  });
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance)
    .then(() => {
      toast({
        title: 'Signed Out',
        description: "You have been successfully signed out.",
      });
      // Redirect is handled by onAuthStateChanged listener
    })
    .catch((error: any) => {
      handleAuthError(error, 'sign-out');
    });
}
