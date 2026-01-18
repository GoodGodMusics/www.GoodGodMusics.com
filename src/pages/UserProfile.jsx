import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Music2, BookOpen, MessageSquare, Settings, Heart, Play, Clock, Mail, Bell, BellOff, Award, Brain } from 'lucide-react';
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
import CharityStore from '@/components/quiz/CharityStore';

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

  // Fetch character subscription
  const { data: characterSubscription } = useQuery({
    queryKey: ['characterSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.CharacterSubscription.filter({ user_email: user.email, is_active: true });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch user quizzes
  const { data: quizzes = [] } = useQuery({
    queryKey: ['userQuizzes', user?.email],
    queryFn: () => base44.entities.Quiz.filter({ user_email: user?.email }, '-created_date', 50),
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
        {/* Header with Character Icon */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6 relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/30 border-4 border-white">
              <User className="w-16 h-16 text-white" />
            </div>
            
            {/* Character Badge Overlay */}
            {characterSubscription && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 bg-gradient-to-br from-purple-600 to-indigo-600 px-4 py-2 rounded-full shadow-xl border-2 border-white"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">{characterSubscription.current_character}</span>
                </div>
              </motion.div>
            )}
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
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-800">{user?.prayer_points || 0}</div>
              <div className="text-sm text-amber-700">Prayer Points</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{likedInteractions.length}</div>
              <div className="text-sm text-stone-600">Liked Songs</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
            <CardContent className="pt-6 text-center">
              <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-stone-800">{quizzes.length}</div>
              <div className="text-sm text-stone-600">Quizzes</div>
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
          <Tabs defaultValue="quizzes" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
              <TabsTrigger value="quizzes" className="rounded-lg">
                <Brain className="w-4 h-4 mr-2" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="charity" className="rounded-lg">
                <Heart className="w-4 h-4 mr-2" />
                Charity
              </TabsTrigger>
              <TabsTrigger value="character" className="rounded-lg">
                <User className="w-4 h-4 mr-2" />
                Character
              </TabsTrigger>
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

            {/* Quizzes Tab */}
            <TabsContent value="quizzes">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Bible Quiz History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quizzes.length > 0 ? (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-stone-800">{quiz.book_name}</div>
                              <div className="text-sm text-stone-600">
                                Score: {quiz.score}/10 • {quiz.points_earned} points earned
                              </div>
                              <div className="text-xs text-stone-500">
                                {new Date(quiz.created_date).toLocaleDateString()} • {quiz.completion_time_seconds}s
                              </div>
                            </div>
                            <Badge className={quiz.score === 10 ? 'bg-green-600' : quiz.score >= 6 ? 'bg-blue-600' : 'bg-stone-400'}>
                              {quiz.score === 10 ? 'Perfect!' : quiz.score >= 8 ? 'Great' : quiz.score >= 6 ? 'Good' : 'Try Again'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-stone-800 mb-2">No Quizzes Yet</h3>
                      <p className="text-stone-600 mb-6">
                        Test your Bible knowledge and earn prayer points!
                      </p>
                      <Button
                        onClick={() => window.location.href = '/BibleTimeline'}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Take Your First Quiz
                      </Button>
                    </div>
                  )}
                  
                  {user?.total_quizzes_taken > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{user?.total_quizzes_taken}</div>
                          <div className="text-xs text-stone-600">Total Quizzes</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{user?.perfect_scores || 0}</div>
                          <div className="text-xs text-stone-600">Perfect Scores</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">{user?.prayer_points || 0}</div>
                          <div className="text-xs text-stone-600">Points Earned</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charity Store Tab */}
            <TabsContent value="charity">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardContent className="p-6">
                  <CharityStore />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Character Tab */}
            <TabsContent value="character">
              <Card className="bg-white/80 backdrop-blur-sm border-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Character of the Week Study
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {characterSubscription ? (
                    <div className="space-y-6">
                      {/* Current Character */}
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <User className="w-10 h-10 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-stone-800">{characterSubscription.current_character}</h3>
                            <p className="text-stone-600">Currently Studying</p>
                            <Badge className="mt-1 bg-purple-600">Day {characterSubscription.day_counter}/7</Badge>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-purple-600" />
                            <span className="text-stone-700">
                              Week: {new Date(characterSubscription.week_start_date).toLocaleDateString()} - {new Date(characterSubscription.week_end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Bell className="w-4 h-4 text-purple-600" />
                            <span className="text-stone-700">Daily emails with chapter summaries and songs</span>
                          </div>
                        </div>
                      </div>

                      {/* Next Character */}
                      {characterSubscription.auto_renew && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                          <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            Coming Up Next Week
                          </h4>
                          <p className="text-stone-600 text-sm mb-3">
                            Your subscription will auto-renew with a new biblical character on {new Date(new Date(characterSubscription.week_end_date).getTime() + 86400000).toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="border-amber-600 text-amber-800">
                            Auto-Renew Active
                          </Badge>
                        </div>
                      )}

                      {/* Completed Characters */}
                      {characterSubscription.completed_characters && characterSubscription.completed_characters.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-stone-800 mb-3">Previously Studied</h4>
                          <div className="flex flex-wrap gap-2">
                            {characterSubscription.completed_characters.map((char, i) => (
                              <Badge key={i} variant="outline" className="text-sm">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-stone-800 mb-2">No Active Character Study</h3>
                      <p className="text-stone-600 mb-6">
                        Subscribe to Character of the Week to receive daily biblical insights
                      </p>
                      <Button
                        onClick={() => window.location.href = '/Discover'}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Subscribe Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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