import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function SubmitMusic() {
  const [formData, setFormData] = useState({
    artist_name: '',
    song_title: '',
    submitter_email: '',
    youtube_link: '',
    spotify_link: '',
    apple_music_link: '',
    description: '',
    submission_type: 'playlist_inclusion',
    biblical_themes: [],
    suggested_chapters: []
  });
  const [themeInput, setThemeInput] = useState('');
  const [chapterInput, setChapterInput] = useState('');

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Get current submission count for numbering
      const submissions = await base44.entities.MusicSubmission.list();
      const submissionNumber = submissions.length + 1;
      
      return base44.entities.MusicSubmission.create({
        ...data,
        submission_number: submissionNumber,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicSubmissions'] });
      toast.success('🎵 Submission received! We\'ll review it soon.');
      setFormData({
        artist_name: '',
        song_title: '',
        submitter_email: '',
        youtube_link: '',
        spotify_link: '',
        apple_music_link: '',
        description: '',
        submission_type: 'playlist_inclusion',
        biblical_themes: [],
        suggested_chapters: []
      });
    },
    onError: () => {
      toast.error('Failed to submit. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const addTheme = () => {
    if (themeInput.trim() && !formData.biblical_themes.includes(themeInput.trim())) {
      setFormData({
        ...formData,
        biblical_themes: [...formData.biblical_themes, themeInput.trim()]
      });
      setThemeInput('');
    }
  };

  const removeTheme = (theme) => {
    setFormData({
      ...formData,
      biblical_themes: formData.biblical_themes.filter(t => t !== theme)
    });
  };

  const addChapter = () => {
    if (chapterInput.trim() && !formData.suggested_chapters.includes(chapterInput.trim())) {
      setFormData({
        ...formData,
        suggested_chapters: [...formData.suggested_chapters, chapterInput.trim()]
      });
      setChapterInput('');
    }
  };

  const removeChapter = (chapter) => {
    setFormData({
      ...formData,
      suggested_chapters: formData.suggested_chapters.filter(c => c !== chapter)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-stone-800 mb-3">
            Submit Your Music
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Share your Christian music with our community. Whether you want your song featured in playlists, 
            request to cover our songs, or explore partnership opportunities.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Artist/Band Name *
                </label>
                <Input
                  value={formData.artist_name}
                  onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                  required
                  placeholder="Your artist name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Song Title *
                </label>
                <Input
                  value={formData.song_title}
                  onChange={(e) => setFormData({ ...formData, song_title: e.target.value })}
                  required
                  placeholder="Song title"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Your Email *
              </label>
              <Input
                type="email"
                value={formData.submitter_email}
                onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Submission Type *
              </label>
              <Select
                value={formData.submission_type}
                onValueChange={(val) => setFormData({ ...formData, submission_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playlist_inclusion">Playlist Inclusion</SelectItem>
                  <SelectItem value="cover_request">Cover Request</SelectItem>
                  <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                YouTube Link *
              </label>
              <Input
                type="url"
                value={formData.youtube_link}
                onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                required
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Spotify Link (Optional)
                </label>
                <Input
                  type="url"
                  value={formData.spotify_link}
                  onChange={(e) => setFormData({ ...formData, spotify_link: e.target.value })}
                  placeholder="https://open.spotify.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Apple Music Link (Optional)
                </label>
                <Input
                  type="url"
                  value={formData.apple_music_link}
                  onChange={(e) => setFormData({ ...formData, apple_music_link: e.target.value })}
                  placeholder="https://music.apple.com/..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Tell us about your song and why it fits Bible Harmony..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Biblical Themes
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  placeholder="e.g., Faith, Grace, Redemption"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTheme())}
                />
                <Button type="button" onClick={addTheme} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.biblical_themes.map((theme) => (
                  <Badge key={theme} variant="outline" className="cursor-pointer" onClick={() => removeTheme(theme)}>
                    {theme} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Suggested Bible Chapters
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={chapterInput}
                  onChange={(e) => setChapterInput(e.target.value)}
                  placeholder="e.g., John 3, Psalm 23"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChapter())}
                />
                <Button type="button" onClick={addChapter} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.suggested_chapters.map((chapter) => (
                  <Badge key={chapter} variant="outline" className="cursor-pointer" onClick={() => removeChapter(chapter)}>
                    {chapter} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-stone-200">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 text-lg"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All submissions are reviewed by our team. We'll contact you at the email provided. 
              For urgent inquiries, email us directly at <a href="mailto:GoodGodMusics@gmail.com" className="underline">GoodGodMusics@gmail.com</a>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}