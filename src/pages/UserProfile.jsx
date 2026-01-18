import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Music2, BookOpen, MessageSquare, Settings, Heart, Play, Clock, Mail, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Separator } from '@/components/ui/separator';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Fetch user interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ['userInteractions', user?.email],
    queryFn: () => base44.entities.UserInteraction.filter({ user_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email
  });

  // Fetch user song suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['userSuggestions', user?.email],
    queryFn: () => base44.entities.SongSuggestion.filter({ submitter_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email
  });

  // Fetch user comments
  const { data: comments = [] } = useQuery({
    queryKey: ['userComments', user?.email],
    queryFn: () => base44.entities.Comment.filter({ user_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userInteractions'] });
    }
  });

  const deleteSuggestionMutation = useMutation({
    mutationFn: (id) => base44.entities.SongSuggestion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userSuggestions'] })
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userComments'] })
  });

  const handlePreferenceUpdate = (key, value) => {
    const preferences = user.preferences || {};
    updateUserMutation.mutate({ preferences: { ...preferences, [key]: value } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-stone-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const likedInteractions = interactions.filter(i => i.interaction_type === 'liked');
  const playedInteractions = interactions.filter(i => i.interaction_type === 'played');
  const viewedInteractions = interactions.filter(i => i.interaction_type === 'viewed');

  const preferences = user?.preferences || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-2">
            {user?.full_name || 'User Profile'}
          </h1>
          <p className="text-stone-600">{user?.email}</p>
          {user?.role === 'admin' && (
            <Badge className="mt-3 bg-amber-600">Admin</Badge>
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{likedInteractions.length}</div>
              <div className="text-sm text-stone-600">Liked Songs</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <Play className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{playedInteractions.length}</div>
              <div className="text-sm text-stone-600">Played</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <Music2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{suggestions.length}</div>
              <div className="text-sm text-stone-600">Suggestions</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{comments.length}</div>
              <div className="text-sm text-stone-600">Comments</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
              <TabsTrigger value="history" className="rounded-lg">
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="rounded-lg">
                <Music2 className="w-4 h-4 mr-2" />
                Suggestions
              </TabsTrigger>
              <TabsTrigger value="comments" className="rounded-lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Your Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Liked Songs */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Liked Songs ({likedInteractions.length})
                    </h3>
                    <div className="space-y-2">
                      {likedInteractions.slice(0, 10).map((interaction) => (
                        <div key={interaction.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-stone-800">{interaction.song_title || 'Untitled'}</div>
                            <div className="text-sm text-stone-600">
                              {interaction.song_artist && `by ${interaction.song_artist} • `}
                              {interaction.chapter_reference}
                            </div>
                          </div>
                          {interaction.youtube_link && (
                            <a
                              href={interaction.youtube_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:text-amber-700"
                            >
                              <Play className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      ))}
                      {likedInteractions.length === 0 && (
                        <p className="text-stone-500 text-sm py-4">No liked songs yet. Start exploring!</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Played Chapters */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-600" />
                      Recently Played ({playedInteractions.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {playedInteractions.slice(0, 12).map((interaction) => (
                        <div key={interaction.id} className="p-2 bg-stone-50 rounded-lg text-center">
                          <div className="text-sm font-medium text-stone-800">{interaction.chapter_reference}</div>
                          {interaction.song_title && (
                            <div className="text-xs text-stone-600 truncate">{interaction.song_title}</div>
                          )}
                        </div>
                      ))}
                      {playedInteractions.length === 0 && (
                        <p className="col-span-full text-stone-500 text-sm py-4">No playback history yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-purple-600" />
                    Your Song Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-stone-800">{suggestion.suggested_song}</div>
                            <div className="text-sm text-stone-600">
                              {suggestion.artist && `by ${suggestion.artist} • `}
                              for {suggestion.book_chapter}
                            </div>
                          </div>
                          <Badge
                            variant={
                              suggestion.status === 'approved' ? 'default' :
                              suggestion.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className={
                              suggestion.status === 'approved' ? 'bg-green-600' :
                              suggestion.status === 'rejected' ? 'bg-red-600' : ''
                            }
                          >
                            {suggestion.status}
                          </Badge>
                        </div>
                        {suggestion.reason && (
                          <p className="text-sm text-stone-600 mb-2">"{suggestion.reason}"</p>
                        )}
                        <div className="flex items-center gap-2">
                          {suggestion.youtube_link && (
                            <a
                              href={suggestion.youtube_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-amber-600 hover:text-amber-700"
                            >
                              View Song
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSuggestionMutation.mutate(suggestion.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {suggestions.length === 0 && (
                      <p className="text-stone-500 text-sm py-8 text-center">
                        You haven't submitted any song suggestions yet. Visit the Bible Timeline to suggest songs!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Your Comments & Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{comment.comment_type}</Badge>
                              <span className="text-xs text-stone-500">{comment.page_reference}</span>
                            </div>
                            <p className="text-sm text-stone-700">{comment.message}</p>
                          </div>
                          <Badge variant={comment.is_approved ? 'default' : 'secondary'}>
                            {comment.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        {comment.admin_reply && (
                          <div className="mt-2 pl-4 border-l-2 border-amber-600 bg-amber-50 p-2 rounded">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Admin Reply:</div>
                            <p className="text-xs text-stone-700">{comment.admin_reply}</p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-stone-500 text-sm py-8 text-center">
                        You haven't left any comments yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-stone-600" />
                    Preferences & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Info */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email} disabled className="bg-stone-100" />
                      </div>
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={user?.full_name} disabled className="bg-stone-100" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Preferences */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-amber-600" />
                          <div>
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-xs text-stone-600">Receive updates about new music releases</p>
                          </div>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={preferences.email_notifications !== false}
                          onCheckedChange={(checked) => handlePreferenceUpdate('email_notifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Music2 className="w-5 h-5 text-purple-600" />
                          <div>
                            <Label htmlFor="new-music-alerts">New Music Alerts</Label>
                            <p className="text-xs text-stone-600">Get notified when GoodGodMusics releases new songs</p>
                          </div>
                        </div>
                        <Switch
                          id="new-music-alerts"
                          checked={preferences.new_music_alerts !== false}
                          onCheckedChange={(checked) => handlePreferenceUpdate('new_music_alerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <div>
                            <Label htmlFor="comment-replies">Comment Reply Notifications</Label>
                            <p className="text-xs text-stone-600">Get notified when admins reply to your comments</p>
                          </div>
                        </div>
                        <Switch
                          id="comment-replies"
                          checked={preferences.comment_replies !== false}
                          onCheckedChange={(checked) => handlePreferenceUpdate('comment_replies', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Actions */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-4">Account</h3>
                    <Button
                      variant="outline"
                      onClick={() => base44.auth.logout()}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}