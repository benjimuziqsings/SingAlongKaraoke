
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Patron } from '@/lib/types';

export interface UsePatronsResult {
  patrons: Patron[];
  isLoading: boolean;
  error: Error | null;
}

export function usePatrons(): UsePatronsResult {
  const firestore = useFirestore();

  const patronsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'patrons'));
  }, [firestore]);

  const { data, isLoading, error } = useCollection<Patron>(patronsQuery);

  const patrons = useMemo(() => {
    if (!data) return [];
    return data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [data]);

  return { patrons, isLoading, error };
}
