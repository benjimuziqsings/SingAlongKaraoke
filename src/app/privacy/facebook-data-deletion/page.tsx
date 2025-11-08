'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function FacebookDataDeletionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Facebook Data Deletion Instructions
            </CardTitle>
            <CardDescription>
              How to request the deletion of your data from Sing A Long Karaoke.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Sing A Long Karaoke uses your Facebook account for authentication purposes. When you sign in with Facebook, we receive your basic public profile information, such as your name and email address. This information is used to create and identify your user account within our app.
            </p>
            <p>
              We do not store your Facebook password. All song requests, reviews, or tips you submit are associated with your user account ID.
            </p>
            
            <h3 className="font-bold text-lg pt-4">How to Request Data Deletion</h3>
            <p>
              If you wish to delete your account and all associated data (including your profile information, song requests, and reviews), please send an email to our support team.
            </p>
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href="mailto:support@example.com" className="font-mono text-primary hover:underline">
                    support@example.com
                </a>
            </div>
            <p>
              In your email, please include the name and email address associated with your Facebook account so we can identify your user profile.
            </p>
            <p>
              Upon receiving your request, we will process the deletion of your account from our Firebase Authentication system and remove all associated records from our Firestore database within 30 days. You will receive a confirmation email once the process is complete.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
