import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Music, Sparkles, Send, Loader2 } from 'lucide-react';

export default function RequestCustomSong() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_email: '',
    recipient_type: 'disabled_individual',
    recipient_name: '',
    personal_details: '',
    favorite_things: '',
    scripture_chapter: '',
    song_style: 'uplifting',
    can_record_reaction: false,
    contact_for_reaction: ''
  });

  const { data: existingRequests = [] } = useQuery({
    queryKey: ['customSongRequests'],
    queryFn: () => base44.entities.CustomSongRequest.list('-request_number')
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data) => {
      const nextRequestNumber = existingRequests.length > 0 
        ? Math.max(...existingRequests.map(r => r.request_number || 0)) + 1 
        : 1;
      
      return base44.entities.CustomSongRequest.create({
        ...data,
        request_number: nextRequestNumber,
        status: 'pending'
      });
    },
    onSuccess: () => {
      alert('Your custom song request has been submitted! We will contact you soon.');
      navigate('/');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitRequestMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-pink-500" />
            <Music className="w-12 h-12 text-purple-500" />
            <Sparkles className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-stone-800 mb-3">Custom Song Requests</h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Request a personalized, faith-filled song for someone special - disabled individuals, 
            terminal patients, or children. We'll create a beautiful, uplifting song with their 
            favorite details and scripture.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Share Their Story</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Requester Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Your Information</h3>
                <Input
                  required
                  placeholder="Your Name"
                  value={formData.requester_name}
                  onChange={(e) => setFormData({...formData, requester_name: e.target.value})}
                />
                <Input
                  required
                  type="email"
                  placeholder="Your Email"
                  value={formData.requester_email}
                  onChange={(e) => setFormData({...formData, requester_email: e.target.value})}
                />
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">About the Recipient</h3>
                <Select value={formData.recipient_type} onValueChange={(v) => setFormData({...formData, recipient_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled_individual">Disabled Individual</SelectItem>
                    <SelectItem value="terminal_patient">Terminal Patient</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  required
                  placeholder="Recipient's Name"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                />
              </div>

              {/* Song Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Song Details</h3>
                <Textarea
                  required
                  placeholder="Share happy personal details about them (their personality, what makes them smile, special memories, how they touch lives...)"
                  value={formData.personal_details}
                  onChange={(e) => setFormData({...formData, personal_details: e.target.value})}
                  rows={5}
                />
                <Textarea
                  placeholder="Their favorite things (hobbies, activities, colors, animals, food...)"
                  value={formData.favorite_things}
                  onChange={(e) => setFormData({...formData, favorite_things: e.target.value})}
                  rows={3}
                />
                <Input
                  placeholder="Bible Chapter/Verse (optional, e.g., Psalms 23)"
                  value={formData.scripture_chapter}
                  onChange={(e) => setFormData({...formData, scripture_chapter: e.target.value})}
                />
                <Select value={formData.song_style} onValueChange={(v) => setFormData({...formData, song_style: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Song Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uplifting">Uplifting & Hopeful</SelectItem>
                    <SelectItem value="peaceful">Peaceful & Calming</SelectItem>
                    <SelectItem value="joyful">Joyful & Celebratory</SelectItem>
                    <SelectItem value="worship">Worship & Prayerful</SelectItem>
                    <SelectItem value="any">Any Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reaction Recording */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Reaction Recording</h3>
                <div className="flex items-start space-x-3 bg-amber-50 p-4 rounded-lg">
                  <Checkbox
                    id="record"
                    checked={formData.can_record_reaction}
                    onCheckedChange={(checked) => setFormData({...formData, can_record_reaction: checked})}
                  />
                  <div className="flex-1">
                    <label htmlFor="record" className="font-medium cursor-pointer">
                      We'd love to see their reaction!
                    </label>
                    <p className="text-sm text-stone-600 mt-1">
                      If possible, we'd be honored to receive a video of them hearing the song for the first time. 
                      These precious moments inspire us and can encourage others.
                    </p>
                  </div>
                </div>
                {formData.can_record_reaction && (
                  <Input
                    placeholder="Best way to share the reaction video (email, phone, etc.)"
                    value={formData.contact_for_reaction}
                    onChange={(e) => setFormData({...formData, contact_for_reaction: e.target.value})}
                  />
                )}
              </div>

              <Button
                type="submit"
                disabled={submitRequestMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 text-white py-6 text-lg"
              >
                {submitRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Song Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-stone-600">
          <p>All requests are processed in the order received (first-come, first-serve).</p>
          <p className="mt-2">We aim to create each custom song with love and care within 1-2 weeks.</p>
        </div>
      </div>
    </div>
  );
}