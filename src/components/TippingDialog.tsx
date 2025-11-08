
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, PartyPopper, CreditCard, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

const tipAmounts = [2, 5, 10, 15, 20];

// Make sure to replace this with your actual public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CashAppIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L9 16V8h1.5l1.5 3 1.5-3H15v8l-1.59-1.59L12 16l-1.41-1.41z"/></svg>
    )
}

function ZelleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M17.83 4.41.88 11.23a1.59 1.59 0 0 0-.05 2.8l1.45.69a1.58 1.58 0 0 1 .66 1.76l-.68 2.39a1.59 1.59 0 0 0 2.22 1.86l2.36-.94a1.58 1.58 0 0 1 1.76.66l.69 1.45a1.59 1.59_0 0 0 2.8-.05L20.59 6.17a1.59 1.59 0 0 0-1.86-2.22l-2.39.68a1.58 1.58 0 0 1-1.76-.66l-.69-1.45a1.59 1.59 0 0 0-2.8.05z"/></svg>
    )
}


export function TippingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleTip = (amount: number) => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to be signed in to send a tip. Please sign in or create an account.'
      });
      return;
    }

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot connect to the database.' });
      return;
    }

    const tipData = {
      amount,
      tipTime: Date.now(),
      patronId: user.uid,
    };

    const tipsCol = collection(firestore, 'tips');
    addDocumentNonBlocking(tipsCol, tipData);

    toast({
      title: 'Thank You!',
      description: `Your tip of $${amount} has been logged. We appreciate your support!`,
    });
    setCustomAmount('');
    setIsOpen(false);
  };

  const handleZellePayment = () => {
    toast({
        title: 'Tip with Zelle',
        description: 'Please use your banking app to send a Zelle payment to: benjimuziqsings@gmail.com',
    });
  }

  const handleStripeCheckout = async (amount: number) => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to be signed in to send a tip.'
      });
      return;
    }
    if (amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid tip amount.'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }
      
      handleTip(amount); // Log the tip attempt in Firestore

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        throw stripeError;
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Could not process payment. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="flex-1 text-lg font-bold border-accent text-accent hover:bg-accent/10 hover:text-accent">
          <DollarSign className="mr-2 h-6 w-6" />
          Send a Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-accent" />
            Support the Show!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-center pt-2">
                <p className="italic">"Tipping is not a MUST but its a PLUS and it goes a long way with US!"</p>
                <p className="not-italic text-sm text-muted-foreground mt-1">Thank you for your support!</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>Send via payment app:</Label>
             <div className="grid grid-cols-2 gap-3">
                 <Button asChild variant="outline" className="py-6 text-lg bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-400">
                    <Link href="https://cash.app/$benjimuziqsings" target="_blank">
                        <CashAppIcon />
                        <span className="ml-2">Cash App</span>
                    </Link>
                </Button>
                 <Button variant="outline" className="py-6 text-lg bg-purple-500/10 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-400" onClick={handleZellePayment}>
                    <ZelleIcon />
                     <span className="ml-2">Zelle</span>
                </Button>
            </div>
          </div>

          <Separator />
          
          <div>
              <Label>One-click tip with Card:</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {tipAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="py-6 text-lg"
                    onClick={() => handleStripeCheckout(amount)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : `$${amount}`}
                  </Button>
                ))}
              </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-tip">Or a custom amount with Card:</Label>
            <div className="flex gap-2">
              <Input
                id="custom-tip"
                type="number"
                placeholder="25.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                onClick={() => handleStripeCheckout(parseFloat(customAmount))}
                disabled={isProcessing || !customAmount || parseFloat(customAmount) <= 0}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                 {isProcessing ? <Loader2 className="animate-spin" /> : <CreditCard />}
                 <span className="ml-2">Pay</span>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
