import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, Heart, ExternalLink, Play, Calendar, Sparkles, Plus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DonationButton from '@/components/ui-custom/DonationButton';
import ShareButton from '@/components/ui-custom/ShareButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlaylistManager from '@/components/playlists/PlaylistManager';

export default function Music() {
  const [user, setUser] = useState(null);
  const [generatingImageFor, setGeneratingImageFor] = useState(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['featuredReleases'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 20)
  });

  const { data: userPlaylists = [] } = useQuery({
    queryKey: ['userPlaylists', user?.email],
    queryFn: () => base44.entities.UserPlaylist.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: userInteractions = [] } = useQuery({
    queryKey: ['userInteractions', user?.email],
    queryFn: () => base44.entities.UserInteraction.filter({ user_email: user.email }),
    enabled: !!user
  });

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const featuredReleases = releases.filter(r => r.is_featured);
  const recentReleases = releases.slice(0, 6);
  const allReleases = releases;

  const generateImageMutation = useMutation({
    mutationFn: async (release) => {
      const prompt = `Create a beautiful Christian worship music album cover for a song titled "${release.title}" by ${release.artist}. ${release.description || ''} Include religious Christian imagery, divine light, crosses, worship themes, peaceful scenes. Style: professional, spiritual, reverent, high quality`;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      return result.url;
    },
    onSuccess: (imageUrl, release) => {
      updateReleaseMutation.mutate({ id: release.id, data: { cover_image_url: imageUrl } });
    }
  });

  const updateReleaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MusicRelease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredReleases'] });
      setGeneratingImageFor(null);
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (release) => {
      const existingLike = userInteractions.find(
        i => i.interaction_type === 'liked' && i.song_title === release.title
      );
      
      if (existingLike) {
        await base44.entities.UserInteraction.delete(existingLike.id);
      } else {
        await base44.entities.UserInteraction.create({
          user_email: user.email,
          interaction_type: 'liked',
          song_title: release.title,
          song_artist: release.artist,
          youtube_link: release.youtube_link
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userInteractions'] });
    }
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, release }) => {
      const playlist = userPlaylists.find(p => p.id === playlistId);
      const songData = {
        chapter_id: release.id,
        book_chapter: release.title,
        song_title: release.title,
        song_artist: release.artist,
        youtube_link: release.youtube_link
      };
      
      const existingSongs = playlist.songs || [];
      await base44.entities.UserPlaylist.update(playlistId, {
        songs: [...existingSongs, songData]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setShowAddToPlaylist(null);
    }
  });

  const handleGenerateImage = (release) => {
    setGeneratingImageFor(release.id);
    generateImageMutation.mutate(release);
  };

  const isLiked = (release) => {
    return userInteractions.some(
      i => i.interaction_type === 'liked' && i.song_title === release.title
    );
  };

  return (
    <div className="min-h-screen">
      {/* Playlists & Media Player Section */}
      {user && (
        <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Music2 className="w-6 h-6 text-white" />
                    </div>
                    My Playlists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlaylistManager userEmail={user?.email} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-red-600" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Music2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
              GoodGodMusics
            </h1>
            <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto mb-4">
              Independent Christian worship music distributed worldwide via DistroKid
            </p>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
              Creating biblically-inspired songs that connect hearts to Scripture and deepen worship experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <DonationButton variant="inline" size="lg" />
              <a href="#latest-releases">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8">
                  <Play className="w-5 h-5 mr-2" />
                  Explore Music
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-6">
              Music That Moves Hearts to Scripture
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed mb-8">
              GoodGodMusics is an independent record label dedicated to creating worship music that 
              brings biblical truths to life. Every song is crafted with deep reverence for God's Word, 
              designed to enhance your spiritual journey and deepen your connection to Scripture.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Biblical Foundation</h3>
                <p className="text-stone-600 text-sm">Every lyric rooted in Scripture</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Heartfelt Worship</h3>
                <p className="text-stone-600 text-sm">Authentic praise and adoration</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Global Reach</h3>
                <p className="text-stone-600 text-sm">Distributed worldwide via DistroKid</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recently Added Highlights */}
      {recentReleases.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <Badge className="mb-4 bg-white text-amber-600 text-lg px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                New Releases
              </Badge>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Recently Added</h2>
              <p className="text-white/80">Discover our latest worship music</p>
            </motion.div>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
              {recentReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-72 snap-center bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-amber-900/50 to-stone-900/50 overflow-hidden group/img">
                    {release.cover_image_url ? (
                      <img src={release.cover_image_url} alt={release.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {generatingImageFor === release.id ? (
                          <Loader className="w-12 h-12 text-white/60 animate-spin" />
                        ) : (
                          <>
                            <Music2 className="w-20 h-20 text-white/40" />
                            <Button
                              size="sm"
                              onClick={() => handleGenerateImage(release)}
                              className="absolute inset-0 m-auto w-32 h-10 bg-white/20 hover:bg-white/30 opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0">NEW</Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{release.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{release.artist}</p>
                    <div className="flex gap-2">
                      {release.youtube_link && (
                        <a href={release.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                            <Play className="w-4 h-4 mr-2 fill-white" />
                            Listen
                          </Button>
                        </a>
                      )}
                      {user && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleLikeMutation.mutate(release)}
                            className={`${isLiked(release) ? 'text-red-500' : 'text-white'} hover:text-red-500`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked(release) ? 'fill-red-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddToPlaylist(release)}
                            className="text-white hover:text-green-400"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Releases */}
      {featuredReleases.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-stone-800 to-stone-900" id="latest-releases">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-serif font-bold text-white mb-4">Featured Releases</h2>
              <p className="text-stone-300 text-lg">Our most impactful worship songs</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-stone-700/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-stone-600/50 hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-amber-900/50 to-stone-900/50 overflow-hidden group/img">
                    {release.cover_image_url ? (
                      <img
                        src={release.cover_image_url}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {generatingImageFor === release.id ? (
                          <Loader className="w-16 h-16 text-stone-400 animate-spin" />
                        ) : (
                          <>
                            <Music2 className="w-24 h-24 text-stone-400" />
                            <Button
                              size="sm"
                              onClick={() => handleGenerateImage(release)}
                              className="absolute inset-0 m-auto w-36 h-12 bg-white/20 hover:bg-white/30 opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Image
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-amber-500 text-white border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">
                      {release.title}
                    </h3>
                    <p className="text-stone-300 mb-4">{release.artist}</p>
                    
                    {release.description && (
                      <p className="text-stone-400 text-sm mb-4 line-clamp-2">
                        {release.description}
                      </p>
                    )}

                    {release.biblical_themes && release.biblical_themes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {release.biblical_themes.slice(0, 3).map((theme, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-amber-400/50 text-amber-300">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {release.youtube_link && (
                        <a href={release.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
                          <Button className="w-full bg-red-600 hover:bg-red-700">
                            <Play className="w-4 h-4 mr-2 fill-white" />
                            YouTube
                          </Button>
                        </a>
                      )}
                      {release.spotify_link && (
                        <a href={release.spotify_link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
                          <Button variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-500/10">
                            Spotify
                          </Button>
                        </a>
                      )}
                      {user && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleLikeMutation.mutate(release)}
                            className={`${isLiked(release) ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked(release) ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setShowAddToPlaylist(release)}
                            className="border-stone-300"
                          >
                            <Plus className="w-4 h-4 text-stone-600" />
                          </Button>
                        </>
                      )}
                      <ShareButton
                        title={`${release.title} - GoodGodMusics`}
                        description={release.description || `New worship music: ${release.title} by ${release.artist}`}
                        url={release.youtube_link || release.spotify_link || window.location.href}
                        hashtags={release.biblical_themes?.slice(0, 2) || ['Worship', 'ChristianMusic']}
                        variant="ghost"
                        size="icon"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Releases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold text-stone-800 mb-4">All Releases</h2>
            <p className="text-stone-600 text-lg">Explore our complete catalog</p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-stone-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-stone-100 to-amber-50 overflow-hidden group/img">
                    {release.cover_image_url ? (
                      <img
                        src={release.cover_image_url}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {generatingImageFor === release.id ? (
                          <Loader className="w-8 h-8 text-stone-400 animate-spin" />
                        ) : (
                          <>
                            <Music2 className="w-12 h-12 text-stone-300" />
                            <Button
                              size="sm"
                              onClick={() => handleGenerateImage(release)}
                              className="absolute inset-0 m-auto w-20 h-8 text-xs bg-stone-800/80 hover:bg-stone-900 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <h3 className="font-semibold text-stone-800 text-xs mb-1 line-clamp-2 leading-tight">
                      {release.title}
                    </h3>
                    <p className="text-stone-600 text-xs mb-2 line-clamp-1">{release.artist}</p>

                    <div className="flex gap-1">
                      {release.youtube_link && (
                        <a href={release.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" className="w-full h-7 bg-red-600 hover:bg-red-700 text-xs px-1">
                            <Play className="w-3 h-3 fill-white" />
                          </Button>
                        </a>
                      )}
                      {user && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleLikeMutation.mutate(release)}
                            className={`h-7 px-2 ${isLiked(release) ? 'text-red-500' : ''}`}
                          >
                            <Heart className={`w-3 h-3 ${isLiked(release) ? 'fill-red-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddToPlaylist(release)}
                            className="h-7 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 to-rose-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <Heart className="w-16 h-16 text-pink-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-6">
              Support Independent Worship Music
            </h2>
            <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
              Your support helps us continue creating biblically-inspired worship music 
              and distributing it worldwide. Every donation goes directly to music production, 
              distribution via DistroKid, and ministry outreach.
            </p>
            <DonationButton variant="inline" size="lg" className="text-lg px-10 py-7" />
            <p className="text-sm text-stone-500 mt-6">
              GoodGodMusics is an independent label • Music distributed via DistroKid
            </p>
          </div>
        </motion.div>
      </section>

      {/* Add to Playlist Modal */}
      <Dialog open={!!showAddToPlaylist} onOpenChange={() => setShowAddToPlaylist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {userPlaylists.length === 0 ? (
              <div className="text-center py-8 text-stone-600">
                <p>You don't have any playlists yet.</p>
                <p className="text-sm mt-2">Create a playlist from your profile to add songs.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-600">
                  Select a playlist to add "{showAddToPlaylist?.title}"
                </p>
                <div className="space-y-2">
                  {userPlaylists.map((playlist) => {
                    const alreadyAdded = playlist.songs?.some(s => s.song_title === showAddToPlaylist?.title);
                    return (
                      <Button
                        key={playlist.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => addToPlaylistMutation.mutate({ playlistId: playlist.id, release: showAddToPlaylist })}
                        disabled={alreadyAdded}
                      >
                        <span>{playlist.name}</span>
                        {alreadyAdded ? (
                          <Badge variant="secondary">Added</Badge>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}