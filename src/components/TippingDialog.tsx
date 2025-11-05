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
import { DollarSign, PartyPopper } from 'lucide-react';

const tipAmounts = [2, 5, 10, 15, 20];

export function TippingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const { toast } = useToast();

  const handleTip = (amount: number) => {
    // In a real app, this would trigger a payment flow.
    // For now, we'll just show a toast.
    toast({
      title: 'Thank You!',
      description: `You've tipped $${amount}. We appreciate your support!`,
    });
    setCustomAmount('');
    setIsOpen(false);
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
          <DialogDescription>
            Tips for the KJ and staff are greatly appreciated.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {tipAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="py-6 text-lg"
                onClick={() => handleTip(amount)}
              >
                ${amount}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-tip">Or a custom amount:</Label>
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
                onClick={() => handleTip(parseFloat(customAmount))}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Tip
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
