import React, { useState, useEffect } from 'react';
import { Plus, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddToPlaylistButton({ chapter, size = "sm" }) {
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user.email);
      } catch {}
    };
    getUser();
  }, []);

  const { data: playlists = [] } = useQuery({
    queryKey: ['userPlaylists', userEmail],
    queryFn: () => base44.entities.UserPlaylist.filter({ user_email: userEmail }),
    enabled: !!userEmail && showModal
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async (playlistId) => {
      const playlist = playlists.find(p => p.id === playlistId);
      const newSong = {
        chapter_id: chapter.id,
        book_chapter: `${chapter.book} ${chapter.chapter_number}`,
        song_title: chapter.song_title,
        artist: chapter.song_artist,
        youtube_link: chapter.youtube_link
      };
      
      const updatedSongs = [...(playlist.songs || []), newSong];
      await base44.entities.UserPlaylist.update(playlistId, { songs: updatedSongs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setShowModal(false);
      alert('Added to playlist!');
    }
  });

  if (!chapter.youtube_link) return null;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          if (!userEmail) {
            alert('Please log in to add to playlists');
            return;
          }
          setShowModal(true);
        }}
      >
        <ListMusic className="w-4 h-4 mr-1" />
        Add to Playlist
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <p className="text-center py-8 text-stone-500">
                No playlists yet. Create one in your profile!
              </p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors"
                >
                  <div className="font-medium text-stone-800">{playlist.name}</div>
                  <div className="text-sm text-stone-600">{playlist.songs?.length || 0} songs</div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}