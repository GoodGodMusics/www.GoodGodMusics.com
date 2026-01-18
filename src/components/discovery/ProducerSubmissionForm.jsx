import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music2, Send, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProducerSubmissionForm() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    artist_name: '',
    artist_email: '',
    song_title: '',
    youtube_link: '',
    spotify_link: '',
    apple_music_link: '',
    genre: 'worship',
    description: '',
    biblical_inspiration: ''
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setFormData(prev => ({ ...prev, artist_email: user.email }));
      } catch {}
    };
    getUser();
  }, []);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.ProducerSubmission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producerSubmissions'] });
      setFormData({
        artist_name: '',
        artist_email: currentUser?.email || '',
        song_title: '',
        youtube_link: '',
        spotify_link: '',
        apple_music_link: '',
        genre: 'worship',
        description: '',
        biblical_inspiration: ''
      });
      alert('Thank you! Your submission has been received and will be reviewed soon.');
    },
    onError: () => {
      alert('Failed to submit. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-6 h-6 text-purple-600" />
          Submit Your Religious Music
        </CardTitle>
        <p className="text-sm text-stone-600">
          Share your divinely inspired music with our community
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700">Artist Name *</label>
              <Input
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                placeholder="Your artist name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Email *</label>
              <Input
                type="email"
                value={formData.artist_email}
                onChange={(e) => setFormData({ ...formData, artist_email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">Song Title *</label>
            <Input
              value={formData.song_title}
              onChange={(e) => setFormData({ ...formData, song_title: e.target.value })}
              placeholder="Enter song title"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">Genre *</label>
            <Select value={formData.genre} onValueChange={(val) => setFormData({ ...formData, genre: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worship">Worship</SelectItem>
                <SelectItem value="gospel">Gospel</SelectItem>
                <SelectItem value="contemporary_christian">Contemporary Christian</SelectItem>
                <SelectItem value="hymn">Hymn</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
                <SelectItem value="spiritual">Spiritual</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700">YouTube Link *</label>
              <Input
                value={formData.youtube_link}
                onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                placeholder="https://youtube.com/..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Spotify Link</label>
              <Input
                value={formData.spotify_link}
                onChange={(e) => setFormData({ ...formData, spotify_link: e.target.value })}
                placeholder="https://spotify.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Apple Music Link</label>
              <Input
                value={formData.apple_music_link}
                onChange={(e) => setFormData({ ...formData, apple_music_link: e.target.value })}
                placeholder="https://music.apple.com/..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your song and its message..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">Biblical Inspiration</label>
            <Input
              value={formData.biblical_inspiration}
              onChange={(e) => setFormData({ ...formData, biblical_inspiration: e.target.value })}
              placeholder="e.g., Psalm 23, John 3:16"
            />
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Music
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}