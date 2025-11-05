

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/firebase/admin';

// This function remains as it is used by the reviews page, which is still a server component for now.
export async function getReviews() {
    if (!db) return { error: "Firestore is not configured." };
    try {
        const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return { reviews: [] };
        }
        const reviews = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        return { reviews };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function addReview(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    const reviewData = {
        name: formData.get('name') as string,
        rating: Number(formData.get('rating')),
        comment: formData.get('comment') as string,
        createdAt: Date.now(),
    };

    try {
        await db.collection('reviews').add(reviewData);
        revalidatePath('/reviews');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
