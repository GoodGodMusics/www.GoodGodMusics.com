import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListMusic, Play, Music2, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PersonalizedPlaylists({ userId }) {
  const queryClient = useQueryClient();

  // Fetch user's playlists
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['personalizedPlaylists', userId],
    queryFn: async () => {
      if (!userId) return [];
      return base44.entities.Playlist.filter({ user_email: userId });
    },
    enabled: !!userId
  });

  // Fetch user interactions to generate playlists
  const { data: interactions = [] } = useQuery({
    queryKey: ['userInteractions', userId],
    queryFn: async () => {
      if (!userId) return [];
      return base44.entities.UserInteraction.filter({ user_email: userId }, '-created_date', 100);
    },
    enabled: !!userId
  });

  // Fetch all chapters with music
  const { data: allChapters = [] } = useQuery({
    queryKey: ['chaptersWithMusic'],
    queryFn: async () => {
      const chapters = await base44.entities.BibleChapter.list('chronological_order', 1500);
      return chapters.filter(c => c.youtube_link);
    }
  });

  const generatePlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!userId || interactions.length === 0) return;

      // Get liked songs
      const likedInteractions = interactions.filter(i => i.interaction_type === 'liked');
      
      // Create "Your Favorites" playlist
      if (likedInteractions.length > 0) {
        const existingFavorites = playlists.find(p => p.theme === 'Favorites');
        if (!existingFavorites) {
          await base44.entities.Playlist.create({
            name: '❤️ Your Favorites',
            description: 'Songs you loved',
            user_email: userId,
            is_system_generated: true,
            playlist_type: 'personalized',
            theme: 'Favorites',
            songs: likedInteractions.map(i => ({
              chapter_id: i.chapter_id,
              song_title: i.song_title,
              artist: i.song_artist,
              youtube_link: i.youtube_link
            })).slice(0, 50),
            is_public: false
          });
        }
      }

      // Get most played themes
      const themeCount = {};
      interactions.forEach(i => {
        if (i.themes && i.themes.length > 0) {
          i.themes.forEach(theme => {
            themeCount[theme] = (themeCount[theme] || 0) + 1;
          });
        }
      });

      const topThemes = Object.entries(themeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([theme]) => theme);

      // Create theme-based playlists
      for (const theme of topThemes) {
        const existingThemePlaylist = playlists.find(p => p.theme === theme);
        if (!existingThemePlaylist) {
          const themeChapters = allChapters.filter(c => c.era === theme).slice(0, 30);
          if (themeChapters.length > 0) {
            await base44.entities.Playlist.create({
              name: `${theme} Playlist`,
              description: `Curated songs from the ${theme} era`,
              user_email: userId,
              is_system_generated: true,
              playlist_type: 'personalized',
              theme: theme,
              chapters: themeChapters.map(c => c.id),
              songs: themeChapters.map(c => ({
                chapter_id: c.id,
                song_title: c.song_title,
                artist: c.song_artist,
                youtube_link: c.youtube_link
              })),
              is_public: false
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalizedPlaylists'] });
    }
  });

  // Auto-generate playlists when user has interactions but no playlists
  useEffect(() => {
    if (userId && interactions.length > 5 && playlists.length === 0 && !isLoading) {
      generatePlaylistMutation.mutate();
    }
  }, [userId, interactions.length, playlists.length, isLoading]);

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-stone-100 rounded-2xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl">
        <ListMusic className="w-16 h-16 text-purple-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-800 mb-2">No Playlists Yet</h3>
        <p className="text-stone-600 mb-6">
          Like songs and explore music to generate personalized playlists
        </p>
        <Button onClick={() => generatePlaylistMutation.mutate()} disabled={interactions.length === 0}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Playlists
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playlists.map((playlist, index) => (
        <motion.div
          key={playlist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">
                {playlist.name}
              </h3>
              <p className="text-stone-600 text-sm mb-2">{playlist.description}</p>
              <Badge variant="outline" className="text-xs">
                {playlist.songs?.length || 0} songs
              </Badge>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              {playlist.theme === 'Favorites' ? (
                <Heart className="w-6 h-6 text-white fill-white" />
              ) : (
                <ListMusic className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {playlist.songs && playlist.songs.length > 0 && (
            <div className="space-y-2 mb-4">
              {playlist.songs.slice(0, 3).map((song, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-white/60 rounded-lg p-2">
                  <Music2 className="w-4 h-4 text-purple-600" />
                  <span className="truncate text-stone-700">{song.song_title}</span>
                </div>
              ))}
              {playlist.songs.length > 3 && (
                <p className="text-xs text-stone-500 text-center">
                  +{playlist.songs.length - 3} more songs
                </p>
              )}
            </div>
          )}

          <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Play Playlist
          </Button>
        </motion.div>
      ))}
    </div>
  );
}