
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
import { Mail, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patron } from '@/lib/types';

interface BlastDialogProps {
  patrons: Patron[];
  type: 'email' | 'sms';
  triggerButton: React.ReactElement;
}

const formSchema = z.object({
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required.'),
});

export function BlastDialog({ patrons, type, triggerButton }: BlastDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: '', message: '' },
  });

  const dialogTitle = type === 'email' ? 'Send Email Blast' : 'Send SMS Blast';
  const icon = type === 'email' ? <Mail /> : <MessageCircle />;
  const recipientCount = patrons.length;
  const isSendDisabled = recipientCount === 0;

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (isSendDisabled) {
      toast({
        variant: 'destructive',
        title: 'No Recipients',
        description: `There are no patrons with a valid ${type === 'email' ? 'email address' : 'phone number'}.`,
      });
      return;
    }

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
    
    // Open the default mail/sms client
    window.location.href = url;

    toast({
      title: 'Opening Client...',
      description: `Your default ${type} application should open shortly.`,
    });

    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={isSendDisabled}>
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
              <Button type="submit">
                <Send className="mr-2" />
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
