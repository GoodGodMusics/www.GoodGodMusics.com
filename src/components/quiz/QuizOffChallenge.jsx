import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Swords, Mail } from 'lucide-react';

export default function QuizOffChallenge({ user }) {
  const [showChallenge, setShowChallenge] = useState(false);
  const [opponentEmail, setOpponentEmail] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('general');
  const [timeLimit, setTimeLimit] = useState(300);
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

  const { data: receivedChallenges = [] } = useQuery({
    queryKey: ['receivedChallenges', user?.email],
    queryFn: async () => {
      const challenges = await base44.entities.QuizOff.filter({ 
        opponent_email: user.email,
        status: 'pending'
      }, '-created_date');
      return challenges;
    },
    enabled: !!user
  });

  const { data: sentChallenges = [] } = useQuery({
    queryKey: ['sentChallenges', user?.email],
    queryFn: async () => {
      const challenges = await base44.entities.QuizOff.filter({ 
        host_email: user.email
      }, '-created_date');
      return challenges;
    },
    enabled: !!user
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.QuizOff.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentChallenges'] });
      setShowChallenge(false);
      setOpponentEmail('');
      alert('Challenge sent!');
    }
  });

  const respondToChallengeMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return base44.entities.QuizOff.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedChallenges'] });
    }
  });

  const handleSendChallenge = () => {
    if (!opponentEmail) {
      alert('Please enter opponent email or select a friend');
      return;
    }

    createChallengeMutation.mutate({
      host_email: user.email,
      host_name: user.full_name || user.email,
      opponent_email: opponentEmail,
      opponent_name: opponentEmail,
      status: 'pending',
      quiz_type: 'general',
      difficulty_level: difficulty,
      category: category,
      time_limit_seconds: timeLimit
    });
  };

  const handleAcceptChallenge = (challenge, startQuiz) => {
    respondToChallengeMutation.mutate({ 
      id: challenge.id, 
      status: 'in_progress' 
    });
    // Trigger quiz start with challenge parameters
    startQuiz(challenge);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-purple-600" />
            Quiz Off Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-stone-600 mb-4">
            Challenge a friend to a timed Bible quiz! Winner is determined by score, then by fastest time.
          </p>
          
          {!showChallenge ? (
            <Button 
              onClick={() => setShowChallenge(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Friend or Enter Email</label>
                {friends.length > 0 && (
                  <Select value={opponentEmail} onValueChange={setOpponentEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a friend" />
                    </SelectTrigger>
                    <SelectContent>
                      {friends.map(f => (
                        <SelectItem key={f.id} value={f.friend_email}>
                          {f.friend_name || f.friend_email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  placeholder="Or enter email address"
                  value={opponentEmail}
                  onChange={(e) => setOpponentEmail(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Time Limit</label>
                  <Select value={timeLimit.toString()} onValueChange={(v) => setTimeLimit(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="180">3 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSendChallenge} className="bg-purple-600 hover:bg-purple-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Challenge
                </Button>
                <Button onClick={() => setShowChallenge(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {receivedChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Received Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivedChallenges.map(challenge => (
              <div key={challenge.id} className="p-4 bg-stone-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{challenge.host_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{challenge.difficulty_level}</Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {challenge.time_limit_seconds}s
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleAcceptChallenge(challenge, () => {})}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => respondToChallengeMutation.mutate({ 
                        id: challenge.id, 
                        status: 'declined' 
                      })}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sentChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentChallenges.map(challenge => (
              <div key={challenge.id} className="p-4 bg-stone-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">vs {challenge.opponent_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={
                        challenge.status === 'completed' ? 'default' :
                        challenge.status === 'in_progress' ? 'secondary' :
                        challenge.status === 'declined' ? 'destructive' :
                        'outline'
                      }>
                        {challenge.status}
                      </Badge>
                      <Badge variant="outline">{challenge.difficulty_level}</Badge>
                    </div>
                  </div>
                  {challenge.status === 'completed' && challenge.winner_email && (
                    <div className="text-right">
                      <Trophy className={`w-6 h-6 ${
                        challenge.winner_email === user.email ? 'text-amber-500' : 'text-stone-400'
                      }`} />
                      <p className="text-xs text-stone-600">
                        {challenge.winner_email === user.email ? 'You Won!' : 'Opponent Won'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}