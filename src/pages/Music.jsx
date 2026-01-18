import React from 'react';
import { motion } from 'framer-motion';
import { Music2, Heart, ExternalLink, Play, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DonationButton from '@/components/ui-custom/DonationButton';

export default function Music() {
  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['featuredReleases'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 20)
  });

  const featuredReleases = releases.filter(r => r.is_featured);
  const allReleases = releases;

  return (
    <div className="min-h-screen">
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
                  <div className="relative aspect-square bg-gradient-to-br from-amber-900/50 to-stone-900/50 overflow-hidden">
                    {release.cover_image_url ? (
                      <img
                        src={release.cover_image_url}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-24 h-24 text-stone-400" />
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

                    <div className="flex gap-2">
                      {release.youtube_link && (
                        <a href={release.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button className="w-full bg-red-600 hover:bg-red-700">
                            <Play className="w-4 h-4 mr-2 fill-white" />
                            YouTube
                          </Button>
                        </a>
                      )}
                      {release.spotify_link && (
                        <a href={release.spotify_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-500/10">
                            Spotify
                          </Button>
                        </a>
                      )}
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
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-stone-100 to-amber-50 overflow-hidden">
                    {release.cover_image_url ? (
                      <img
                        src={release.cover_image_url}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-16 h-16 text-stone-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-stone-800 mb-1 line-clamp-1">
                      {release.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-3 line-clamp-1">{release.artist}</p>
                    
                    {release.release_date && (
                      <div className="flex items-center gap-1 text-xs text-stone-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        {new Date(release.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {release.youtube_link && (
                        <a href={release.youtube_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-xs">
                            <Play className="w-3 h-3 fill-white" />
                          </Button>
                        </a>
                      )}
                      {(release.spotify_link || release.apple_music_link) && (
                        <Button size="sm" variant="outline" className="flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
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
    </div>
  );
}