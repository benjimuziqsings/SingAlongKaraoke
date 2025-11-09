/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {defineString} from "firebase-functions/params";

// Initialize Firebase Admin SDK
initializeApp();

// Define environment variables for SendGrid
const sendgridApiKey = defineString("SENDGRID_API_KEY");
const fromEmail = defineString("FROM_EMAIL");


// A function to send email blasts to all registered patrons
export const sendEmailBlast = onRequest({cors: true}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const {subject, message} = req.body;

  if (!subject || !message) {
    res.status(400).send("Missing subject or message");
    return;
  }

  try {
    const firestore = getFirestore();
    const patronsSnapshot = await firestore.collection("patrons").get();
    const emails = patronsSnapshot.docs
      .map((doc) => doc.data().email)
      .filter((email) => email);

    if (emails.length === 0) {
      res.status(200).send("No patrons with emails to send to.");
      return;
    }

    logger.info(`Sending email to ${emails.length} patrons.`);

    // This is a placeholder for the actual email sending logic using SendGrid
    // In a real implementation, you would use the SendGrid Node.js library here
    // Example:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendgridApiKey.value());
    const msg = {
      to: emails,
      from: fromEmail.value(),
      subject: subject,
      text: message,
      html: `<p>${message}</p>`,
    };
    await sgMail.sendMultiple(msg);
    */

    // For now, we'll just log the action
    logger.info("Email blast prepared (simulation):", {
      from: fromEmail.value(),
      to: emails,
      subject,
      message,
    });


    res.status(200).send({
      message: `Email blast sent to ${emails.length} patrons successfully (simulation).`,
    });
  } catch (error) {
    logger.error("Error sending email blast:", error);
    res.status(500).send("Failed to send email blast.");
  }
});
