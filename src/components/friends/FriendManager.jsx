import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Check, X, Users, MessageCircle } from 'lucide-react';

export default function FriendManager({ user, onMessageClick }) {
  const [friendEmail, setFriendEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', user?.email],
    queryFn: async () => {
      const friendships = await base44.entities.Friendship.filter({ 
        user_email: user.email, 
        status: 'accepted' 
      });
      return friendships;
    },
    enabled: !!user
  });

  const { data: pendingSent = [] } = useQuery({
    queryKey: ['pendingSent', user?.email],
    queryFn: async () => {
      const requests = await base44.entities.Friendship.filter({ 
        user_email: user.email, 
        status: 'pending' 
      });
      return requests;
    },
    enabled: !!user
  });

  const { data: pendingReceived = [] } = useQuery({
    queryKey: ['pendingReceived', user?.email],
    queryFn: async () => {
      const requests = await base44.entities.Friendship.filter({ 
        friend_email: user.email, 
        status: 'pending' 
      });
      return requests;
    },
    enabled: !!user
  });

  const addFriendMutation = useMutation({
    mutationFn: async (email) => {
      return base44.entities.Friendship.create({
        user_email: user.email,
        friend_email: email,
        user_name: user.full_name || user.email,
        friend_name: email,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSent'] });
      setFriendEmail('');
      alert('Friend request sent!');
    }
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return base44.entities.Friendship.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingReceived'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });

  const handleAddFriend = () => {
    if (!friendEmail || friendEmail === user.email) {
      alert('Please enter a valid email address');
      return;
    }
    addFriendMutation.mutate(friendEmail);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({pendingReceived.length})</TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-3">
            {friends.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No friends yet</p>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <p className="font-medium">{friend.friend_name || friend.friend_email}</p>
                    <p className="text-xs text-stone-500">{friend.friend_email}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onMessageClick?.(friend)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-3">
            {pendingReceived.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No pending requests</p>
            ) : (
              pendingReceived.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium">{request.user_name || request.user_email}</p>
                    <p className="text-xs text-stone-500">{request.user_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => respondToRequestMutation.mutate({ 
                        id: request.id, 
                        status: 'accepted' 
                      })}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => respondToRequestMutation.mutate({ 
                        id: request.id, 
                        status: 'blocked' 
                      })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="add">
            <div className="space-y-4">
              <Input
                placeholder="Friend's email address"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
              />
              <Button 
                onClick={handleAddFriend}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={!friendEmail || addFriendMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send Friend Request
              </Button>

              {pendingSent.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Pending Sent Requests:</p>
                  {pendingSent.map(request => (
                    <div key={request.id} className="p-2 bg-stone-50 rounded mb-2">
                      <p className="text-sm">{request.friend_email}</p>
                      <Badge variant="outline" className="text-xs mt-1">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}