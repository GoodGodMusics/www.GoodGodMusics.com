import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, TrendingUp, Send, Play, Pause, CheckCircle, 
  Target, Mail, BarChart3, Loader2 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function CampaignManager({ userEmail }) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  const [formData, setFormData] = useState({
    campaign_name: '',
    track_title: '',
    campaign_type: 'spotify_playlist',
    pitch_message: '',
    biblical_themes: [],
    budget: 0
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', userEmail],
    queryFn: () => base44.entities.MusicCampaign.filter({ user_email: userEmail }, '-created_date')
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.MusicRelease.list('-created_date', 100)
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.MusicCampaign.create({
      ...data,
      user_email: userEmail
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateOpen(false);
      toast.success('Campaign created');
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MusicCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    }
  });

  const launchCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      // Log API usage for campaign launch
      await base44.entities.APIUsageLog.create({
        service: 'core_llm',
        endpoint: 'campaign_launch',
        user_email: userEmail,
        function_name: 'launch_campaign',
        credits_used: 10,
        bandwidth_bytes: 1024
      });

      // Update campaign status
      await base44.entities.MusicCampaign.update(campaign.id, {
        status: 'active',
        start_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign launched!');
    }
  });

  const handleCreate = () => {
    createCampaignMutation.mutate(formData);
  };

  const statusColors = {
    draft: 'bg-stone-100 text-stone-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Submissions</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.submissions_sent || 0), 0)}
                </p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Playlist Adds</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.playlist_adds || 0), 0)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Streams</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.total_streams || 0), 0).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Music Campaigns</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftCampaigns.length})</TabsTrigger>
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-stone-500">
                No active campaigns. Launch a campaign to start promoting!
              </CardContent>
            </Card>
          ) : (
            activeCampaigns.map(campaign => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{campaign.campaign_name}</h3>
                        <Badge className={statusColors[campaign.status]}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-stone-600 mb-4">Track: {campaign.track_title}</p>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-stone-500">Submissions</p>
                          <p className="font-semibold">{campaign.submissions_sent || 0}</p>
                        </div>
                        <div>
                          <p className="text-stone-500">Responses</p>
                          <p className="font-semibold">{campaign.responses_received || 0}</p>
                        </div>
                        <div>
                          <p className="text-stone-500">Playlist Adds</p>
                          <p className="font-semibold text-green-600">{campaign.playlist_adds || 0}</p>
                        </div>
                        <div>
                          <p className="text-stone-500">Streams</p>
                          <p className="font-semibold">{(campaign.total_streams || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCampaignMutation.mutate({ 
                          id: campaign.id, 
                          data: { status: 'paused' } 
                        })}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          {draftCampaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{campaign.campaign_name}</h3>
                    <p className="text-stone-600">Track: {campaign.track_title}</p>
                  </div>
                  <Button
                    onClick={() => launchCampaignMutation.mutate(campaign)}
                    disabled={launchCampaignMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {launchCampaignMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Launch
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{campaign.campaign_name}</h3>
                      <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                    </div>
                    <p className="text-sm text-stone-600">{campaign.track_title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Campaign Name</label>
              <Input
                value={formData.campaign_name}
                onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                placeholder="Summer Gospel Promotion 2026"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Track</label>
              <Select
                value={formData.track_title}
                onValueChange={(value) => setFormData({...formData, track_title: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a track" />
                </SelectTrigger>
                <SelectContent>
                  {releases.map(release => (
                    <SelectItem key={release.id} value={release.title}>
                      {release.title} - {release.artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Campaign Type</label>
              <Select
                value={formData.campaign_type}
                onValueChange={(value) => setFormData({...formData, campaign_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotify_playlist">Spotify Playlist Pitching</SelectItem>
                  <SelectItem value="youtube_promotion">YouTube Promotion</SelectItem>
                  <SelectItem value="curator_outreach">Curator Outreach</SelectItem>
                  <SelectItem value="tiktok_campaign">TikTok Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Pitch Message</label>
              <Textarea
                value={formData.pitch_message}
                onChange={(e) => setFormData({...formData, pitch_message: e.target.value})}
                placeholder="Write your pitch to curators..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Budget (USD)</label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                placeholder="100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createCampaignMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}