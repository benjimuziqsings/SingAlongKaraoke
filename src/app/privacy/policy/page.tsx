
'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Privacy Policy for Sing A Long Karaoke
            </CardTitle>
            <CardDescription>
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="font-bold text-xl mb-2">Introduction</h2>
              <p>
                Welcome to Sing A Long Karaoke. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-2">Information We Collect</h2>
              <p>
                We may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Personal Identification Information:</strong> Your name and email address, which we receive from the authentication provider you choose to sign in with (e.g., Google, Facebook, or email).
                </li>
                <li>
                  <strong>User-Generated Content:</strong> Song requests, including song titles, artist names, and any special announcements you provide. We also collect any reviews or tips you submit.
                </li>
                <li>
                  <strong>Usage Data:</strong> We use Firebase Authentication to manage user sessions. This includes your unique user ID (UID).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-2">How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide, operate, and maintain our karaoke service.</li>
                <li>Manage the song queue and display your requested singer name.</li>
                <li>Process tips and display reviews.</li>
                <li>Create and manage your user account.</li>
                <li>Improve our application and user experience.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-bold text-xl mb-2">Data Sharing and Disclosure</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your singer name will be publicly visible in the song queue. All other personal data is accessible only by authorized personnel (the Karaoke Jockey) for the purpose of running the event.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-2">Data Security</h2>
              <p>
                We use Firebase, a Google platform, which implements a variety of security measures to maintain the safety of your personal information. Your data is stored in a secure Firestore database with access controls defined by our Security Rules.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-xl mb-2">Data Retention and Deletion</h2>
              <p>
                We retain your song request history to populate your user profile. If you wish to delete your account and all associated data, you can request this by following the instructions on our <Link href="/privacy/facebook-data-deletion" className="text-primary hover:underline">Data Deletion page</Link>. We will process your request within 30 days.
              </p>
            </section>
            
            <section>
              <h2 className="font-bold text-xl mb-2">Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </section>
            
            <section>
              <h2 className="font-bold text-xl mb-2">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
