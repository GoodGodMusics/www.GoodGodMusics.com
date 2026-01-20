import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Link2, X } from 'lucide-react';

export default function DirectMessaging({ user, selectedFriend, onClose }) {
  const [message, setMessage] = useState('');
  const [sharedLink, setSharedLink] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email, selectedFriend?.friend_email],
    queryFn: async () => {
      const sent = await base44.entities.DirectMessage.filter({ 
        from_email: user.email,
        to_email: selectedFriend.friend_email
      }, '-created_date');
      
      const received = await base44.entities.DirectMessage.filter({ 
        from_email: selectedFriend.friend_email,
        to_email: user.email
      }, '-created_date');

      const all = [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );

      // Mark received messages as read
      const unreadIds = received.filter(m => !m.is_read).map(m => m.id);
      unreadIds.forEach(id => {
        base44.entities.DirectMessage.update(id, { is_read: true });
      });

      return all;
    },
    enabled: !!user && !!selectedFriend,
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.DirectMessage.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage('');
      setSharedLink('');
    }
  });

  const handleSend = () => {
    if (!message.trim() && !sharedLink.trim()) return;

    sendMessageMutation.mutate({
      from_email: user.email,
      to_email: selectedFriend.friend_email,
      from_name: user.full_name || user.email,
      to_name: selectedFriend.friend_name || selectedFriend.friend_email,
      message: message.trim(),
      shared_link: sharedLink.trim() || null
    });
  };

  if (!selectedFriend) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600">Select a friend to start messaging</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {selectedFriend.friend_name || selectedFriend.friend_email}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-stone-50 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.from_email === user.email
                      ? 'ml-auto bg-amber-100'
                      : 'mr-auto bg-white border'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  {msg.shared_link && (
                    <a 
                      href={msg.shared_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      <Link2 className="w-3 h-3" />
                      {msg.shared_link.substring(0, 40)}...
                    </a>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(msg.created_date).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Input
              placeholder="Share a link (optional)"
              value={sharedLink}
              onChange={(e) => setSharedLink(e.target.value)}
            />
            <Button 
              onClick={handleSend}
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={!message.trim() && !sharedLink.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}