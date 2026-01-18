import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Check, X, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function CharacterSubscription() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [testament, setTestament] = useState('Both');
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    getUser();
  }, []);

  // Fetch user's subscription
  const { data: subscription } = useQuery({
    queryKey: ['characterSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.CharacterSubscription.filter({ user_email: user.email, is_active: true });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  // Biblical characters list
  const biblicalCharacters = [
    'Abraham', 'Moses', 'David', 'Solomon', 'Elijah', 'Isaiah', 'Jeremiah',
    'Daniel', 'Esther', 'Ruth', 'Joseph', 'Joshua', 'Gideon', 'Samuel',
    'Jesus', 'Peter', 'Paul', 'John', 'Mary', 'Martha', 'Stephen', 'Timothy'
  ];

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email || !selectedCharacter) return;
      
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      await base44.entities.CharacterSubscription.create({
        user_email: user.email,
        current_character: selectedCharacter,
        week_start_date: today.toISOString().split('T')[0],
        week_end_date: weekEnd.toISOString().split('T')[0],
        day_counter: 1,
        is_active: true,
        auto_renew: true,
        preferences: {
          preferred_testament: testament,
          character_types: []
        },
        completed_characters: [],
        last_email_sent: null
      });

      // Send welcome email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Your Character of the Week: ${selectedCharacter}`,
        body: `
          <h2>Welcome to Bible Harmony Character Study!</h2>
          <p>You've subscribed to learn about <strong>${selectedCharacter}</strong> this week.</p>
          <p>Starting tomorrow, you'll receive daily emails with:</p>
          <ul>
            <li>Chapter summaries about ${selectedCharacter}</li>
            <li>Curated worship songs</li>
            <li>Spiritual insights</li>
          </ul>
          <p>This subscription will auto-renew weekly with a new character unless you opt out.</p>
          <p><em>To unsubscribe, simply reply to any daily email with "STOP" or manage your subscription in your profile.</em></p>
          <br/>
          <p>Blessings,<br/>Bible Harmony Team</p>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterSubscription'] });
      setIsEditing(false);
      setSelectedCharacter('');
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (isActive) => {
      if (!subscription) return;
      await base44.entities.CharacterSubscription.update(subscription.id, { is_active: isActive });
      
      if (!isActive) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Character Study Subscription Paused',
          body: `
            <h2>Subscription Paused</h2>
            <p>Your Character of the Week subscription has been paused.</p>
            <p>You can reactivate it anytime from your profile or the Discover page.</p>
            <br/>
            <p>God bless,<br/>Bible Harmony Team</p>
          `
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterSubscription'] });
    }
  });

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 text-center border-2 border-indigo-200">
        <User className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">
          Character of the Week
        </h3>
        <p className="text-stone-600 mb-6">
          Sign in to receive daily biblical character studies and worship music via email
        </p>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Sign In to Subscribe
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-serif font-bold text-stone-800">Character of the Week</h3>
          <p className="text-stone-600 text-sm">Daily biblical insights delivered to your inbox</p>
        </div>
      </div>

      {subscription && subscription.is_active ? (
        <div>
          <div className="bg-white rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-indigo-600 text-white">Active</Badge>
                  <Badge variant="outline">Day {subscription.day_counter}/7</Badge>
                </div>
                <h4 className="text-2xl font-bold text-stone-800 mb-1">
                  {subscription.current_character}
                </h4>
                <p className="text-stone-600 text-sm">
                  Week: {new Date(subscription.week_start_date).toLocaleDateString()} - {new Date(subscription.week_end_date).toLocaleDateString()}
                </p>
              </div>
              <User className="w-16 h-16 text-indigo-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Calendar className="w-4 h-4" />
                Next email: Tomorrow
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Sparkles className="w-4 h-4" />
                Auto-renew: {subscription.auto_renew ? 'On' : 'Off'}
              </div>
            </div>

            {subscription.completed_characters && subscription.completed_characters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-500 mb-2">Previously studied:</p>
                <div className="flex flex-wrap gap-1">
                  {subscription.completed_characters.slice(-5).map((char, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{char}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => updateSubscriptionMutation.mutate(false)}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Pause Subscription
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-stone-700 mb-6">
            Receive daily emails featuring chapter summaries and worship songs about a biblical character. 
            Auto-renews weekly with a new character.
          </p>

          <AnimatePresence>
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white rounded-2xl p-6 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Choose a Character
                      </label>
                      <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a biblical character" />
                        </SelectTrigger>
                        <SelectContent>
                          {biblicalCharacters.map(char => (
                            <SelectItem key={char} value={char}>{char}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Testament Preference
                      </label>
                      <Select value={testament} onValueChange={setTestament}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Both">Both Testaments</SelectItem>
                          <SelectItem value="Old Testament">Old Testament</SelectItem>
                          <SelectItem value="New Testament">New Testament</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => createSubscriptionMutation.mutate()}
                    disabled={!selectedCharacter || createSubscriptionMutation.isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {createSubscriptionMutation.isLoading ? 'Subscribing...' : 'Start Subscription'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedCharacter('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Subscribe to Character of the Week
              </Button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}