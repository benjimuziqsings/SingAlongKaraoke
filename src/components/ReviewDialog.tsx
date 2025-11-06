
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageSquarePlus, Star } from 'lucide-react';

const reviewSchema = z.object({
  name: z.string().min(1, { message: 'Your name is required.' }),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, { message: 'Review must be at least 10 characters.' }),
});

export function ReviewDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: '',
      rating: 5,
      comment: '',
    },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot connect to the database.' });
      return;
    }
    
    const reviewData = {
      ...values,
      createdAt: Date.now(),
    };

    const reviewsCol = collection(firestore, 'reviews');
    addDocumentNonBlocking(reviewsCol, reviewData);
    
    toast({
      title: 'Review Submitted!',
      description: 'Thanks for your feedback!',
    });
    form.reset();
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="flex-1 text-lg font-bold">
          <MessageSquarePlus className="mr-2 h-6 w-6" />
          Leave a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Leave a Review
          </DialogTitle>
          <DialogDescription>
            Let us know what you think about the show!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane D." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                      className="flex space-x-1"
                    >
                      {[1, 2, 3, 4, 5].map(rating => (
                         <FormItem key={rating} className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                             <RadioGroupItem value={String(rating)} id={`rating-${rating}`} className="peer sr-only" />
                           </FormControl>
                           <FormLabel htmlFor={`rating-${rating}`} className="cursor-pointer">
                              <Star className={`transition-colors h-8 w-8 text-muted peer-data-[state=checked]:text-accent`} />
                           </FormLabel>
                         </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your experience..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
