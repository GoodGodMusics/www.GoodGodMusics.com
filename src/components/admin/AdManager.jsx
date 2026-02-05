import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusCircle, Edit, Trash2, Eye, MousePointerClick, 
  Sparkles, DollarSign, Loader2, Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function AdManager() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    ad_name: '',
    ad_type: 'goodgodmusics_promo',
    client_name: '',
    client_email: '',
    headline: '',
    body_text: '',
    cta_text: 'Learn More',
    destination_url: '',
    ad_size: '300x250',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['adContent'],
    queryFn: () => base44.entities.AdContent.list('-created_date')
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.BibleChapter.list('-chronological_order', 20)
  });

  const createAdMutation = useMutation({
    mutationFn: (data) => base44.entities.AdContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adContent'] });
      resetForm();
      toast.success('Ad created');
    }
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adContent'] });
      resetForm();
      toast.success('Ad updated');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id) => base44.entities.AdContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adContent'] });
      toast.success('Ad deleted');
    }
  });

  const generateWeeklyAds = async () => {
    setIsGenerating(true);
    try {
      const currentWeek = new Date().toISOString().split('T')[0];
      
      // Check if ads already exist for this week
      const existingWeeklyAds = ads.filter(ad => ad.generation_week === currentWeek);
      if (existingWeeklyAds.length > 0) {
        toast.error('Weekly ads already generated');
        setIsGenerating(false);
        return;
      }

      // Select 5 random chapters with music
      const chaptersWithMusic = chapters.filter(ch => ch.youtube_link);
      const selectedChapters = chaptersWithMusic
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const sizes = ['300x250', '728x90', '160x600', '300x600', '320x50'];

      for (let i = 0; i < selectedChapters.length; i++) {
        const chapter = selectedChapters[i];
        const size = sizes[i % sizes.length];

        // Generate AI ad creative
        const prompt = `Create a compelling advertisement for a Christian music platform called Bible Harmony by GoodGodMusics. 
        
        Featured content: ${chapter.book} Chapter ${chapter.chapter_number}
        Song: "${chapter.song_title}" by ${chapter.song_artist}
        Key themes: ${chapter.key_themes?.join(', ') || 'faith, hope, love'}
        Summary: ${chapter.summary || ''}
        
        Generate JSON with these fields:
        - headline: Catchy, faith-inspiring headline (max 50 chars)
        - body_text: Compelling description (max 120 chars)
        - cta_text: Call to action button text (max 20 chars)
        
        Tone: Uplifting, spiritual, warm. Emphasize connection to scripture through music.`;

        const response = await base44.functions.secureInvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              body_text: { type: 'string' },
              cta_text: { type: 'string' }
            }
          }
        });

        // Generate ad image
        const imagePrompt = `Christian music album cover for ${chapter.book} ${chapter.chapter_number}. 
        Biblical themes: ${chapter.key_themes?.join(', ')}. 
        Artistic style: warm, spiritual, golden hour lighting, ethereal, peaceful. 
        Include subtle cross or dove imagery. Professional quality.`;

        const imageResult = await base44.functions.secureGenerateImage({
          prompt: imagePrompt
        });

        await base44.entities.AdContent.create({
          ad_name: `Weekly Promo: ${chapter.book} ${chapter.chapter_number}`,
          ad_type: 'goodgodmusics_promo',
          headline: response.headline,
          body_text: response.body_text,
          cta_text: response.cta_text,
          destination_url: `https://yoursite.com/chapter/${chapter.id}`,
          ad_size: size,
          image_url: imageResult.url,
          is_active: true,
          ai_generated: true,
          song_reference: `${chapter.book} ${chapter.chapter_number}`,
          generation_week: currentWeek,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }

      queryClient.invalidateQueries({ queryKey: ['adContent'] });
      toast.success('Generated 5 weekly promotional ads!');
    } catch (error) {
      console.error('Error generating ads:', error);
      toast.error('Failed to generate ads');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createAdMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      ad_name: '',
      ad_type: 'goodgodmusics_promo',
      client_name: '',
      client_email: '',
      headline: '',
      body_text: '',
      cta_text: 'Learn More',
      destination_url: '',
      ad_size: '300x250',
      image_url: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
    setEditingAd(null);
    setIsModalOpen(false);
  };

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Ads</p>
                <p className="text-2xl font-bold">{ads.length}</p>
              </div>
              <Sparkles className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Impressions</p>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Clicks</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
              <MousePointerClick className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">CTR</p>
                <p className="text-2xl font-bold">{ctr}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
            <Button 
              onClick={generateWeeklyAds} 
              disabled={isGenerating}
              variant="outline"
              className="border-amber-600 text-amber-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Weekly Promos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ad List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Ads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
            </div>
          ) : ads.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No ads created yet</p>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-stone-800">{ad.ad_name}</h4>
                      <Badge className={
                        ad.ad_type === 'client_paid' ? 'bg-green-100 text-green-800' :
                        ad.ad_type === 'goodgodmusics_promo' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {ad.ad_type === 'client_paid' ? 'Client' : ad.ad_type === 'goodgodmusics_promo' ? 'Promo' : 'Charity'}
                      </Badge>
                      {ad.ai_generated && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">
                      {ad.ad_size} • {ad.impressions || 0} views • {ad.clicks || 0} clicks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={(checked) => 
                        updateAdMutation.mutate({ id: ad.id, data: { is_active: checked } })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAd(ad);
                        setFormData(ad);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this ad?')) {
                          deleteAdMutation.mutate(ad.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Ad Name</Label>
              <Input
                value={formData.ad_name}
                onChange={(e) => setFormData({...formData, ad_name: e.target.value})}
                placeholder="Internal reference name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ad Type</Label>
                <Select value={formData.ad_type} onValueChange={(value) => setFormData({...formData, ad_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goodgodmusics_promo">GoodGodMusics Promo</SelectItem>
                    <SelectItem value="client_paid">Client Paid Ad</SelectItem>
                    <SelectItem value="charity_partner">Charity Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ad Size</Label>
                <Select value={formData.ad_size} onValueChange={(value) => setFormData({...formData, ad_size: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300x250">300x250 (Medium Rectangle)</SelectItem>
                    <SelectItem value="728x90">728x90 (Leaderboard)</SelectItem>
                    <SelectItem value="160x600">160x600 (Wide Skyscraper)</SelectItem>
                    <SelectItem value="300x600">300x600 (Half Page)</SelectItem>
                    <SelectItem value="320x50">320x50 (Mobile Banner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.ad_type === 'client_paid' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Headline</Label>
              <Input
                value={formData.headline}
                onChange={(e) => setFormData({...formData, headline: e.target.value})}
                placeholder="Catchy ad headline"
              />
            </div>

            <div>
              <Label>Body Text</Label>
              <Textarea
                value={formData.body_text}
                onChange={(e) => setFormData({...formData, body_text: e.target.value})}
                placeholder="Ad description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Button Text</Label>
                <Input
                  value={formData.cta_text}
                  onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                  placeholder="Learn More"
                />
              </div>
              <div>
                <Label>Destination URL</Label>
                <Input
                  value={formData.destination_url}
                  onChange={(e) => setFormData({...formData, destination_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="Ad creative image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
                  {editingAd ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}