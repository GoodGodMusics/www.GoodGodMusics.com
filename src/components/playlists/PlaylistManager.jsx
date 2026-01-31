import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Plus, Trash2, Edit2, Play, Eye, EyeOff, X, Check, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PlaylistManager({ userEmail }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's playlists
  const { data: playlists = [] } = useQuery({
    queryKey: ['userPlaylists', userEmail],
    queryFn: () => base44.entities.UserPlaylist.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail
  });

  // Fetch all chapters with songs
  const { data: allChapters = [] } = useQuery({
    queryKey: ['chaptersWithSongs'],
    queryFn: async () => {
      const chapters = await base44.entities.BibleChapter.list('chronological_order', 1500);
      return chapters.filter(c => c.youtube_link && c.song_title);
    }
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.UserPlaylist.create({
      name,
      user_email: userEmail,
      songs: [],
      is_public: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setShowCreateModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPlaylist.update(id, data),
    onSuccess: (updatedPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setEditingName(null);
      // Update selected playlist with latest data
      if (selectedPlaylist?.id === updatedPlaylist.id) {
        setSelectedPlaylist(updatedPlaylist);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPlaylist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      if (selectedPlaylist?.id === editingName) setSelectedPlaylist(null);
    }
  });

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('playlistName');
    if (name.trim()) {
      createMutation.mutate(name.trim());
    }
  };

  const handleRename = (playlist) => {
    if (newName.trim() && newName !== playlist.name) {
      updateMutation.mutate({
        id: playlist.id,
        data: { name: newName.trim() }
      });
    } else {
      setEditingName(null);
    }
  };

  const handleAddSong = (chapter) => {
    if (!selectedPlaylist) return;

    const songData = {
      chapter_id: chapter.id,
      book_chapter: `${chapter.book} ${chapter.chapter_number}`,
      song_title: chapter.song_title,
      song_artist: chapter.song_artist,
      youtube_link: chapter.youtube_link
    };

    const existingSongs = selectedPlaylist.songs || [];
    const alreadyAdded = existingSongs.some(s => s.chapter_id === chapter.id);

    if (alreadyAdded) {
      alert('This song is already in the playlist');
      return;
    }

    updateMutation.mutate({
      id: selectedPlaylist.id,
      data: { songs: [...existingSongs, songData] }
    });
  };

  const handleRemoveSong = (songIndex) => {
    if (!selectedPlaylist) return;
    const updatedSongs = selectedPlaylist.songs.filter((_, i) => i !== songIndex);
    updateMutation.mutate({
      id: selectedPlaylist.id,
      data: { songs: updatedSongs }
    });
  };

  const filteredChapters = allChapters.filter(chapter =>
    !searchQuery ||
    chapter.book?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.song_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${chapter.book} ${chapter.chapter_number}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreateMore = playlists.length < 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-stone-800">My Playlists ({playlists.length}/5)</h3>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          disabled={!canCreateMore}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      {!canCreateMore && (
        <Alert>
          <AlertDescription>
            You've reached the maximum of 5 playlists. Delete one to create a new playlist.
          </AlertDescription>
        </Alert>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800 mb-2">No Playlists Yet</h3>
            <p className="text-stone-600 mb-6">Create your first playlist to organize your favorite Bible songs</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              Create Your First Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <motion.div key={playlist.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  selectedPlaylist?.id === playlist.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedPlaylist(playlist)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {editingName === playlist.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(playlist);
                              if (e.key === 'Escape') setEditingName(null);
                            }}
                            className="text-lg font-bold"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleRename(playlist)}>
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h4 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                          {playlist.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingName(playlist.id);
                              setNewName(playlist.name);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </h4>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
                    <Music2 className="w-4 h-4" />
                    {playlist.songs?.length || 0} songs
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlaylist(playlist);
                        setShowAddSongsModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Songs
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this playlist?')) deleteMutation.mutate(playlist.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected Playlist Details */}
      {selectedPlaylist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-purple-600" />
              {selectedPlaylist.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPlaylist.songs?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-stone-600 mb-4">No songs in this playlist yet</p>
                <Button onClick={() => setShowAddSongsModal(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Song
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPlaylist.songs.map((song, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-stone-400" />
                      <div className="flex-1">
                        <div className="font-semibold text-stone-800">{song.song_title}</div>
                        <div className="text-sm text-stone-600">
                          {song.song_artist} • {song.book_chapter}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {song.youtube_link && (
                        <a href={song.youtube_link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Play className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSong(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Playlist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div>
              <Label>Playlist Name *</Label>
              <Input
                name="playlistName"
                placeholder="My Favorite Worship Songs"
                required
                maxLength={50}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                Create Playlist
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Songs Modal */}
      <Dialog open={showAddSongsModal} onOpenChange={setShowAddSongsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Songs to {selectedPlaylist?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Search by book, chapter, or song name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredChapters.map((chapter) => {
                const alreadyAdded = selectedPlaylist?.songs?.some(s => s.chapter_id === chapter.id);
                return (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-stone-800">{chapter.song_title}</div>
                      <div className="text-sm text-stone-600">
                        {chapter.song_artist} • {chapter.book} {chapter.chapter_number}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddSong(chapter)}
                      disabled={alreadyAdded}
                      className={alreadyAdded ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}
                    >
                      {alreadyAdded ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
              {filteredChapters.length === 0 && (
                <div className="text-center py-12 text-stone-500">
                  No songs found matching your search
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}