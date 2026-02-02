import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Mail, MessageSquare, TrendingUp, Calendar, Search, Filter } from 'lucide-react';

export default function CuratorCRM() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurator, setSelectedCurator] = useState(null);
  const [isAddCuratorOpen, setIsAddCuratorOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const queryClient = useQueryClient();

  const [curatorForm, setCuratorForm] = useState({
    name: '',
    platform: 'spotify',
    playlist_url: '',
    contact_email: '',
    genres: [],
    followers: '',
    submission_guidelines: '',
    biblical_friendly: true
  });

  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'email_sent',
    subject: '',
    message: '',
    response: '',
    status: 'pending',
    next_follow_up: ''
  });

  const { data: curators = [] } = useQuery({
    queryKey: ['curators'],
    queryFn: () => base44.entities.Curator.list('-created_date', 200)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['curatorInteractions'],
    queryFn: () => base44.entities.CuratorInteraction.list('-created_date', 500)
  });

  const createCuratorMutation = useMutation({
    mutationFn: (data) => base44.entities.Curator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['curators']);
      setIsAddCuratorOpen(false);
      setCuratorForm({ name: '', platform: 'spotify', playlist_url: '', contact_email: '', genres: [], followers: '', submission_guidelines: '', biblical_friendly: true });
    }
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.CuratorInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['curatorInteractions']);
      setIsAddInteractionOpen(false);
      setInteractionForm({ interaction_type: 'email_sent', subject: '', message: '', response: '', status: 'pending', next_follow_up: '' });
    }
  });

  const filteredCurators = curators.filter(c => 
    (filterPlatform === 'all' || c.platform === filterPlatform) &&
    (!searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCuratorInteractions = (curatorId) => {
    return interactions.filter(i => i.curator_id === curatorId).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const getCuratorStats = (curatorId) => {
    const curatorInteractions = getCuratorInteractions(curatorId);
    return {
      total: curatorInteractions.length,
      accepted: curatorInteractions.filter(i => i.status === 'accepted').length,
      rejected: curatorInteractions.filter(i => i.status === 'rejected').length,
      pending: curatorInteractions.filter(i => i.status === 'pending').length,
      responseRate: curatorInteractions.length > 0 ? 
        ((curatorInteractions.filter(i => i.status === 'replied' || i.status === 'accepted' || i.status === 'rejected').length / curatorInteractions.length) * 100).toFixed(1) : 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Curator CRM</h2>
          <p className="text-stone-600">Manage relationships and track communications</p>
        </div>
        <Dialog open={isAddCuratorOpen} onOpenChange={setIsAddCuratorOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Curator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Curator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Curator/Playlist Name"
                value={curatorForm.name}
                onChange={(e) => setCuratorForm({...curatorForm, name: e.target.value})}
              />
              <Select value={curatorForm.platform} onValueChange={(v) => setCuratorForm({...curatorForm, platform: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="apple_music">Apple Music</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Playlist/Channel URL"
                value={curatorForm.playlist_url}
                onChange={(e) => setCuratorForm({...curatorForm, playlist_url: e.target.value})}
              />
              <Input
                placeholder="Contact Email"
                type="email"
                value={curatorForm.contact_email}
                onChange={(e) => setCuratorForm({...curatorForm, contact_email: e.target.value})}
              />
              <Input
                placeholder="Follower Count"
                type="number"
                value={curatorForm.followers}
                onChange={(e) => setCuratorForm({...curatorForm, followers: parseInt(e.target.value)})}
              />
              <Textarea
                placeholder="Submission Guidelines"
                value={curatorForm.submission_guidelines}
                onChange={(e) => setCuratorForm({...curatorForm, submission_guidelines: e.target.value})}
              />
              <Button 
                onClick={() => createCuratorMutation.mutate(curatorForm)}
                disabled={!curatorForm.name || createCuratorMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Add Curator
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search curators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="spotify">Spotify</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="apple_music">Apple Music</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Curators List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredCurators.map((curator) => {
          const stats = getCuratorStats(curator.id);
          return (
            <Card key={curator.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCurator(curator)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{curator.name}</CardTitle>
                    <p className="text-sm text-stone-500 mt-1">{curator.contact_email}</p>
                  </div>
                  <Badge>{curator.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stone-500">Followers</p>
                    <p className="font-semibold">{curator.followers?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Response Rate</p>
                    <p className="font-semibold">{stats.responseRate}%</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Accepted</p>
                    <p className="font-semibold text-green-600">{stats.accepted}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Pending</p>
                    <p className="font-semibold text-amber-600">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Curator Detail Modal */}
      {selectedCurator && (
        <Dialog open={!!selectedCurator} onOpenChange={() => setSelectedCurator(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCurator.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-500">Platform</p>
                  <Badge>{selectedCurator.platform}</Badge>
                </div>
                <div>
                  <p className="text-stone-500">Email</p>
                  <p className="font-medium">{selectedCurator.contact_email}</p>
                </div>
                <div>
                  <p className="text-stone-500">Followers</p>
                  <p className="font-medium">{selectedCurator.followers?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-stone-500">URL</p>
                  <a href={selectedCurator.playlist_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-sm">
                    View Playlist
                  </a>
                </div>
              </div>

              {selectedCurator.submission_guidelines && (
                <div>
                  <p className="text-stone-500 text-sm mb-1">Guidelines</p>
                  <p className="text-sm bg-stone-50 p-3 rounded">{selectedCurator.submission_guidelines}</p>
                </div>
              )}

              <Dialog open={isAddInteractionOpen} onOpenChange={setIsAddInteractionOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Interaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log New Interaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Select value={interactionForm.interaction_type} onValueChange={(v) => setInteractionForm({...interactionForm, interaction_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email_sent">Email Sent</SelectItem>
                        <SelectItem value="response_received">Response Received</SelectItem>
                        <SelectItem value="submission_made">Submission Made</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Subject"
                      value={interactionForm.subject}
                      onChange={(e) => setInteractionForm({...interactionForm, subject: e.target.value})}
                    />
                    <Textarea
                      placeholder="Message/Notes"
                      value={interactionForm.message}
                      onChange={(e) => setInteractionForm({...interactionForm, message: e.target.value})}
                    />
                    <Button
                      onClick={() => createInteractionMutation.mutate({
                        ...interactionForm,
                        curator_id: selectedCurator.id,
                        curator_name: selectedCurator.name
                      })}
                      disabled={createInteractionMutation.isPending}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      Save Interaction
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div>
                <h3 className="font-semibold mb-3">Interaction History</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getCuratorInteractions(selectedCurator.id).map((interaction) => (
                    <div key={interaction.id} className="bg-stone-50 p-3 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{interaction.interaction_type}</Badge>
                        <span className="text-xs text-stone-500">
                          {new Date(interaction.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      {interaction.subject && <p className="font-medium">{interaction.subject}</p>}
                      {interaction.message && <p className="text-stone-600 mt-1">{interaction.message}</p>}
                      {interaction.status && (
                        <Badge className="mt-2" variant={interaction.status === 'accepted' ? 'default' : 'secondary'}>
                          {interaction.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}