import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MessagingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  // Get accepted connections
  const { data: connections = [] } = useQuery({
    queryKey: ['acceptedConnections', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const sent = await base44.entities.ConnectionRequest.filter({
        from_user_email: currentUser.email,
        status: 'accepted'
      });
      const received = await base44.entities.ConnectionRequest.filter({
        to_user_email: currentUser.email,
        status: 'accepted'
      });
      return [...sent, ...received];
    },
    enabled: !!currentUser
  });

  // Get messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentUser?.email, selectedUser],
    queryFn: async () => {
      if (!currentUser || !selectedUser) return [];
      const sent = await base44.entities.UserMessage.filter({
        from_user_email: currentUser.email,
        to_user_email: selectedUser
      });
      const received = await base44.entities.UserMessage.filter({
        from_user_email: selectedUser,
        to_user_email: currentUser.email
      });
      return [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!currentUser && !!selectedUser,
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const recipient = connections.find(c => 
        c.from_user_email === selectedUser || c.to_user_email === selectedUser
      );
      const recipientName = recipient.from_user_email === selectedUser 
        ? recipient.from_user_name 
        : recipient.to_user_name;
      
      return base44.entities.UserMessage.create({
        from_user_email: currentUser.email,
        from_user_name: currentUser.full_name,
        to_user_email: selectedUser,
        to_user_name: recipientName,
        message: text
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageText('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const connectedUsers = connections.map(c => ({
    email: c.from_user_email === currentUser?.email ? c.to_user_email : c.from_user_email,
    name: c.from_user_email === currentUser?.email ? c.to_user_name : c.from_user_name,
    purpose: c.purpose
  }));

  const unreadCount = 0; // Could track unread messages

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center p-0">
            {unreadCount}
          </Badge>
        )}
      </motion.button>

      {/* Messaging Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border-2 border-amber-900/20 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-2xl">
            <h3 className="font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Messages
            </h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Contacts List */}
            <div className="w-1/3 border-r border-stone-200 overflow-y-auto">
              {connectedUsers.map(user => (
                <button
                  key={user.email}
                  onClick={() => setSelectedUser(user.email)}
                  className={`w-full p-3 text-left hover:bg-amber-50 transition-colors border-b border-stone-100 ${
                    selectedUser === user.email ? 'bg-amber-100' : ''
                  }`}
                >
                  <div className="font-semibold text-sm text-stone-800 truncate">{user.name}</div>
                  <div className="text-xs text-stone-500">{user.purpose}</div>
                </button>
              ))}
              {connectedUsers.length === 0 && (
                <div className="p-4 text-center text-sm text-stone-500">
                  No connections yet
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  <ScrollArea className="flex-1 p-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`mb-3 ${
                          msg.from_user_email === currentUser.email ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            msg.from_user_email === currentUser.email
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>

                  {/* Input */}
                  <form onSubmit={handleSend} className="p-3 border-t border-stone-200">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-stone-400">
                  <p className="text-sm">Select a contact to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}