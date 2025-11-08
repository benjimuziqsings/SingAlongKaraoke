
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { QrCode, Smartphone } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';

export function QRCodeDialog() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // This runs only on the client, after hydration
    if (typeof window !== 'undefined') {
      const publicUrl = `${window.location.origin}/home`;
      setUrl(publicUrl);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`);
    }
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
            <QrCode className="mr-2 h-4 w-4" />
            Show QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Smartphone />
            Patron Access
          </DialogTitle>
          <DialogDescription>
            Patrons can scan this QR code to open the request app.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center space-y-4 py-4">
            {qrCodeUrl ? (
              <div className="bg-white p-4 rounded-lg inline-block">
                  <Image
                      src={qrCodeUrl}
                      alt="QR code to access the karaoke app"
                      width={200}
                      height={200}
                  />
              </div>
            ) : (
                <Skeleton className="h-[232px] w-[232px] mx-auto" />
            )}
            {url ? (
                <p className="text-sm font-mono bg-muted rounded p-2 break-all">{url}</p>
            ) : (
                <Skeleton className="h-8 w-full" />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
