'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Smartphone } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function QRCodePlaceholder() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // This runs only on the client, after hydration
    setUrl(window.location.origin);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <Smartphone />
          Patron Access
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">Patrons can scan this QR code to open the request app.</p>
        <div className="bg-white p-4 rounded-lg inline-block">
          <QrCode className="h-32 w-32 text-black" />
        </div>
        {url ? (
            <p className="text-sm font-mono bg-muted rounded p-2 break-all">{url}</p>
        ) : (
            <Skeleton className="h-8 w-full" />
        )}
      </CardContent>
    </Card>
  );
}
