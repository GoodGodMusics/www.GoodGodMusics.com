import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BookHeart, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ConnectionRequestModal({ isOpen, onClose, chapterReference }) {
  const [purpose, setPurpose] = useState('connecting');
  const [message, setMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const queryClient = useQueryClient();

  const sendRequestMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      return base44.entities.ConnectionRequest.create({
        from_user_email: currentUser.email,
        from_user_name: currentUser.full_name,
        to_user_email: data.recipientEmail,
        purpose: data.purpose,
        message: data.message,
        book_chapter: chapterReference,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectionRequests'] });
      onClose();
      setMessage('');
      setRecipientEmail('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendRequestMutation.mutate({ recipientEmail, purpose, message });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-stone-800">Connect with Reader</h2>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <Label htmlFor="email" className="text-stone-700 mb-2 block">
                Recipient Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="reader@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                className="border-stone-300"
              />
            </div>

            <div>
              <Label className="text-stone-700 mb-3 block">Connection Purpose</Label>
              <RadioGroup value={purpose} onValueChange={setPurpose}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="reading" id="reading" />
                  <Label htmlFor="reading" className="cursor-pointer">
                    📖 Bible Reading Together
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="prayer" id="prayer" />
                  <Label htmlFor="prayer" className="cursor-pointer">
                    🙏 Prayer Partnership
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="connecting" id="connecting" />
                  <Label htmlFor="connecting" className="cursor-pointer">
                    💬 General Connection
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {chapterReference && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  <BookHeart className="w-4 h-4 inline mr-2" />
                  Context: {chapterReference}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="message" className="text-stone-700 mb-2 block">
                Personal Message
              </Label>
              <Textarea
                id="message"
                placeholder="Share why you'd like to connect..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="border-stone-300"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={sendRequestMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}