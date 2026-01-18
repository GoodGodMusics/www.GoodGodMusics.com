import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music2, TrendingUp, Calendar, ExternalLink, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecommendationEngine from '@/components/recommendations/RecommendationEngine';
import PersonalizedPlaylists from '@/components/discovery/PersonalizedPlaylists';
import ThemeRadio from '@/components/discovery/ThemeRadio';
import CharacterSubscription from '@/components/discovery/CharacterSubscription';
import LikeDislikeButton from '@/components/discovery/LikeDislikeButton';
import ShareButton from '@/components/ui-custom/ShareButton';
import ProducerSubmissionForm from '@/components/discovery/ProducerSubmissionForm';
import ChristianMemeGallery from '@/components/discovery/ChristianMemeGallery';
import DevotionalSubmissionForm from '@/components/devotionals/DevotionalSubmissionForm';

export default function Discover() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const user = await base44.auth.me();
        setUserId(user.email);
      } catch {
        const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
        localStorage.setItem('sessionId', sessionId);
        setUserId(sessionId);
      }
    };
    getUserId();
  }, []);

  // Get all music releases
  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['allReleases'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 50)
  });

  // Get approved producer submissions
  const { data: producerSubmissions = [] } = useQuery({
    queryKey: ['approvedProducerSubmissions'],
    queryFn: () => base44.entities.ProducerSubmission.filter({ status: 'approved' }, '-created_date', 30)
  });

  const featuredReleases = releases.filter(r => r.is_featured);
  const latestReleases = releases.slice(0, 12);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Discover New Music
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
              AI-powered recommendations and new releases from GoodGodMusics. 
              Find your next favorite worship song.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Character of the Week Subscription */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-8 relative z-10">
        <CharacterSubscription />
      </section>

      {/* AI Recommendations */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <RecommendationEngine userId={userId} />
      </section>

      {/* Personalized Playlists */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">Your Playlists</h2>
          <p className="text-stone-600">Generated from your listening history</p>
        </div>
        <PersonalizedPlaylists userId={userId} />
      </section>

      {/* Theme Radio */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ThemeRadio />
      </section>

      {/* Producer Submissions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">Community Artists</h2>
          <p className="text-stone-600">Divine music from independent religious producers</p>
        </div>
        
        <div className="mb-12">
          <ProducerSubmissionForm />
        </div>

        {producerSubmissions.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {producerSubmissions.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-lg text-stone-800 mb-1">
                        {submission.song_title}
                      </h3>
                      <p className="text-stone-600 text-sm">{submission.artist_name}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {submission.genre.replace('_', ' ')}
                    </Badge>
                  </div>

                  {submission.description && (
                    <p className="text-stone-600 text-sm mb-3 line-clamp-2">
                      {submission.description}
                    </p>
                  )}

                  {submission.biblical_inspiration && (
                    <p className="text-xs text-purple-600 italic mb-4">
                      Inspired by {submission.biblical_inspiration}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" /> {submission.plays_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music2 className="w-3 h-3" /> {submission.likes_count || 0}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {submission.youtube_link && (
                      <a href={submission.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                          <Play className="w-4 h-4 mr-1 fill-white" />
                          YouTube
                        </Button>
                      </a>
                    )}
                    {submission.spotify_link && (
                      <a href={submission.spotify_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-green-500 text-green-700">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* User Devotional Submissions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <DevotionalSubmissionForm />
      </section>

      {/* Christian Memes */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl">
        <ChristianMemeGallery />
      </section>

      {/* GoodGodMusics Releases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-stone-800">GoodGodMusics Releases</h2>
              <p className="text-stone-500">Independent worship music via DistroKid</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="latest" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Latest Releases
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Featured ({featuredReleases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-stone-100 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : latestReleases.length === 0 ? (
              <div className="text-center py-20">
                <Music2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No releases yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestReleases.map((release, index) => (
                  <motion.div
                    key={release.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                      {release.cover_image_url ? (
                        <img
                          src={release.cover_image_url}
                          alt={release.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="w-20 h-20 text-purple-300" />
                        </div>
                      )}
                      {release.is_featured && (
                        <Badge className="absolute top-4 right-4 bg-amber-500 text-white border-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-6">
                      <h3 className="font-serif font-bold text-lg text-stone-800 mb-1">
                        {release.title}
                      </h3>
                      <p className="text-stone-600 text-sm mb-3">{release.artist}</p>
                      
                      {release.release_date && (
                        <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                          <Calendar className="w-3 h-3" />
                          {new Date(release.release_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}

                      {release.description && (
                        <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                          {release.description}
                        </p>
                      )}

                      {release.biblical_themes && release.biblical_themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {release.biblical_themes.slice(0, 3).map((theme, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-purple-200 text-purple-700">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mb-3">
                        <LikeDislikeButton song={release} size="sm" />
                        <div className="ml-auto">
                          <ShareButton
                            title={`${release.title} - GoodGodMusics`}
                            description={release.description || `${release.title} by ${release.artist}`}
                            url={release.youtube_link || release.spotify_link || window.location.href}
                            hashtags={release.biblical_themes?.slice(0, 2) || ['Worship']}
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex gap-2">
                        {release.youtube_link && (
                          <a
                            href={release.youtube_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                              <Play className="w-4 h-4 mr-1 fill-white" />
                              YouTube
                            </Button>
                          </a>
                        )}
                        {release.spotify_link && (
                          <a
                            href={release.spotify_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button size="sm" variant="outline" className="w-full border-green-500 text-green-700">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Spotify
                            </Button>
                          </a>
                        )}
                        {release.apple_music_link && (
                          <a
                            href={release.apple_music_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="border-pink-500 text-pink-700">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured">
            {featuredReleases.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No featured releases at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredReleases.map((release, index) => (
                  <motion.div
                    key={release.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl overflow-hidden border-2 border-amber-200 hover:shadow-2xl transition-shadow"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                      {release.cover_image_url ? (
                        <img
                          src={release.cover_image_url}
                          alt={release.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-20 h-20 text-amber-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif font-bold text-xl text-stone-800 mb-2">
                        {release.title}
                      </h3>
                      <p className="text-stone-600 mb-4">{release.artist}</p>
                      {release.description && (
                        <p className="text-stone-600 text-sm mb-4">
                          {release.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {release.youtube_link && (
                          <a
                            href={release.youtube_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button className="w-full bg-red-600 hover:bg-red-700">
                              <Play className="w-4 h-4 mr-2 fill-white" />
                              Listen Now
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}