
'use client';

import { getReviews } from '@/lib/actions';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '@/lib/types';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="flex flex-col min-h-screen bg-transparent">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
                <h1 className="font-headline text-4xl mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Patron Reviews
                </h1>
                <Suspense fallback={<ReviewsLoadingSkeleton />}>
                    <ReviewsList />
                </Suspense>
            </main>
        </div>
    );
}

function ReviewsList() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReviews() {
            setIsLoading(true);
            const fetchedReviews = await getReviews();
            setReviews(fetchedReviews);
            setIsLoading(false);
        }
        fetchReviews();
    }, []);


    if (isLoading) {
        return <ReviewsLoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {reviews.length > 0 ? (
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
                                        {formatDistanceToNow(review.createdAt, { addSuffix: true })}
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
