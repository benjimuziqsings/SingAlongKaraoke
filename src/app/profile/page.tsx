
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, collection, query, where, orderBy, getDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Song, GroupedSong } from '@/lib/types';
import { Suspense, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { SongQueue } from '@/components/SongQueue';
import { History } from 'lucide-react';


const profileSchema = z.object({
  displayName: z.string(),
  email: z.string().email(),
  telephone: z.string().optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});


function ProfileLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
}


function UserSongHistory() {
  const { user } = useUser();
  const firestore = useFirestore();

  const historyQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'song_requests'),
      where('patronId', '==', user.uid),
      orderBy('requestTime', 'desc')
    );
  }, [user, firestore]);

  const { data: songs, isLoading } = useCollection<Song>(historyQuery);

  const groupedHistory: GroupedSong[] = songs ? songs.reduce((acc, song) => {
    const key = `${song.songTitle}-${song.artistName}`;
    let group = acc.find(g => g.groupedId === key);
    if (!group) {
      group = {
        id: song.id,
        groupedId: key,
        title: song.songTitle,
        artist: song.artistName,
        status: song.status,
        requestTime: song.requestTime,
        requesters: [],
      };
      acc.push(group);
    }
    group.requesters.push({
      singer: song.singer,
      announcement: song.specialAnnouncement,
      originalId: song.id
    });
    if (song.requestTime > group.requestTime) {
      group.requestTime = song.requestTime;
    }
    return acc;
  }, [] as GroupedSong[]) : [];


  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3"><History /> Your Song History</CardTitle>
      </CardHeader>
      <CardContent>
        {groupedHistory.length > 0 ? (
          <SongQueue songs={groupedHistory} isHistory />
        ) : (
          <p className="text-muted-foreground">You haven't requested any songs yet.</p>
        )}
      </CardContent>
    </Card>
  );
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      telephone: ''
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const patronDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'patrons', user.uid);
  }, [user, firestore]);

  useEffect(() => {
    if (patronDocRef) {
      getDoc(patronDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const patronData = docSnap.data();
          profileForm.setValue('telephone', patronData.telephone || '');
        }
      });
    }
    if (user) {
        profileForm.setValue('displayName', user.displayName || '');
        profileForm.setValue('email', user.email || '');
    }
  }, [patronDocRef, user, profileForm]);


  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !patronDocRef) return;
    updateDocumentNonBlocking(patronDocRef, {
        telephone: values.telephone,
    });
    toast({ title: 'Profile Updated!', description: 'Your information has been saved.' });
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user) return;
    try {
      await updatePassword(user, values.newPassword);
      toast({ title: 'Password Updated!', description: 'Your password has been changed successfully.' });
      passwordForm.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  if (isUserLoading || !user) {
    return (
        <>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
                <ProfileLoadingSkeleton />
            </main>
        </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <h1 className="font-headline text-4xl text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Your Profile
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your display name and contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl><Input {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="telephone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone</FormLabel>
                    <FormControl><Input placeholder="Your phone number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>Save Changes</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>Update Password</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />
        
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
           <UserSongHistory />
        </Suspense>

      </main>
    </div>
  );
}
