
'use client';

import { useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Patron } from '@/lib/types';

export interface UsePatronsResult {
  patrons: Patron[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePatrons(): UsePatronsResult {
  const firestore = useFirestore();

  const patronsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'patrons'));
  }, [firestore]);

  const { data, isLoading, error, refetch: refetchCollection } = useCollection<Patron>(patronsQuery);
  
  const patrons = useMemo(() => {
    if (!data) return [];
    return data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [data]);
  
  const refetch = useCallback(() => {
    if (refetchCollection) {
        refetchCollection();
    }
  }, [refetchCollection]);


  return { patrons, isLoading, error, refetch };
}
