
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patron } from '@/lib/types';

interface BlastDialogProps {
  patrons: Patron[];
  type: 'email' | 'sms';
  triggerButton: React.ReactElement;
  functionUrl?: string;
}

const formSchema = z.object({
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required.'),
});

export function BlastDialog({ patrons, type, triggerButton, functionUrl }: BlastDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: '', message: '' },
  });

  const dialogTitle = type === 'email' ? 'Send Email Blast' : 'Send SMS Blast';
  const icon = type === 'email' ? <Mail /> : <MessageCircle />;
  const recipientCount = patrons.length;
  const isSendDisabled = recipientCount === 0 || form.formState.isSubmitting;
  const useCloudFunction = type === 'email' && functionUrl;

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (recipientCount === 0) {
      toast({
        variant: 'destructive',
        title: 'No Recipients',
        description: `There are no patrons with a valid ${type === 'email' ? 'email address' : 'phone number'}.`,
      });
      return;
    }

    // Use server-side function for email if URL is provided
    if (useCloudFunction) {
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to send email blast.');
        }

        const result = await response.json();
        toast({
          title: 'Email Blast Sent!',
          description: result.message || 'Your message has been queued for sending.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Could not send email blast.',
        });
      }
    } else { // Fallback to local client for SMS or if email function not configured
      let url = '';
      if (type === 'email') {
        const emails = patrons.map(p => p.email).join(',');
        const subject = encodeURIComponent(values.subject || '');
        const body = encodeURIComponent(values.message);
        url = `mailto:${emails}?subject=${subject}&body=${body}`;
      } else { // sms
        const numbers = patrons.map(p => p.telephone).join(',');
        const body = encodeURIComponent(values.message);
        url = `sms:${numbers}?&body=${body}`;
      }
      
      window.location.href = url;
      toast({
        title: 'Opening Client...',
        description: `Your default ${type} application should open shortly.`,
      });
    }

    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={recipientCount === 0}>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Compose a message to send to all {recipientCount} eligible patrons.
            {useCloudFunction && ' This will be sent from the server.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {type === 'email' && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="An update from the show!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type your message here..." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSendDisabled}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2" />
                {form.formState.isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
