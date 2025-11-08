
'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '@/lib/types';
import { Suspense, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';


function ReviewsLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    )
}

export default function ReviewsPage() {
    return (
        <div className="flex flex-col flex-1 bg-transparent">
            <Header />
            <div className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
                <h1 className="font-headline text-4xl mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Patron Reviews
                </h1>
                <Suspense fallback={<ReviewsLoadingSkeleton />}>
                    <ReviewsList />
                </Suspense>
            </div>
        </div>
    );
}

function ReviewsList() {
    const firestore = useFirestore();
    const reviewsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'))
    }, [firestore]);
    
    const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
    
    if (isLoading) {
        return <ReviewsLoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
                reviews.map(review => (
                    <Card key={review.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserCircle className="h-5 w-5" />
                                        {review.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'just now'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="italic">"{review.comment}"</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
