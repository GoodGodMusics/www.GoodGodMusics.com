import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music2, Plus, Trash2, Edit, Play, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PlaylistManager({ userEmail }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const queryClient = useQueryClient();

  const { data: playlists = [] } = useQuery({
    queryKey: ['userPlaylists', userEmail],
    queryFn: () => base44.entities.UserPlaylist.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserPlaylist.create({
      ...data,
      user_email: userEmail,
      songs: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPlaylist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPlaylist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPlaylists'] })
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', is_public: false });
    setShowCreateModal(false);
    setEditingPlaylist(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlaylist) {
      updateMutation.mutate({ id: editingPlaylist.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      is_public: playlist.is_public
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-stone-800">My Playlists</h3>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800 mb-2">No Playlists Yet</h3>
            <p className="text-stone-600 mb-6">Create your first playlist to organize your favorite songs</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              Create Your First Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <motion.div key={playlist.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-stone-800">{playlist.name}</h4>
                      {playlist.description && (
                        <p className="text-sm text-stone-600 line-clamp-2">{playlist.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {playlist.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {playlist.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
                    <Music2 className="w-4 h-4" />
                    {playlist.songs?.length || 0} songs
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(playlist)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this playlist?')) deleteMutation.mutate(playlist.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Playlist Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Favorite Worship Songs"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Make playlist public</Label>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}