import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookOpen, Music2, ShoppingBag, Play, ChevronRight, 
  Star, Users, Heart, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HeroSection from '@/components/ui-custom/HeroSection';
import CommentSection from '@/components/comments/CommentSection';
import ThemeSongPlayer from '@/components/homepage/ThemeSongPlayer';
import FeaturedSongButtons from '@/components/homepage/FeaturedSongButtons';

export default function Home() {
  // Fetch featured chapters with music
  const { data: featuredChapters = [] } = useQuery({
    queryKey: ['featuredChapters'],
    queryFn: () => base44.entities.BibleChapter.filter({ youtube_link: { $exists: true } }, '-created_date', 6)
  });

  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => base44.entities.Product.filter({ featured: true }, '-created_date', 4)
  });

  // Fetch homepage theme song settings
  const { data: homepageSettings } = useQuery({
    queryKey: ['homepageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.HomepageSettings.list('-created_date', 1);
      return settings[0];
    }
  });

  const features = [
    {
      icon: BookOpen,
      title: 'Complete Bible Coverage',
      description: 'Every chapter of the Bible organized chronologically with curated music selections.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Music2,
      title: 'Inspirational Music',
      description: 'Hand-picked songs that enhance your understanding and connection to scripture.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'Suggest songs and help build the ultimate biblical music experience together.',
      color: 'from-rose-500 to-red-500'
    }
  ];

  const testimonials = [
    {
      quote: "Bible Harmony has transformed my daily devotional time. The music selections are perfect.",
      author: "Sarah M.",
      role: "Pastor's Wife"
    },
    {
      quote: "Finally, a resource that combines my love for music with deep biblical study.",
      author: "James R.",
      role: "Worship Leader"
    },
    {
      quote: "The chronological order helps me understand the Bible's story like never before.",
      author: "Maria L.",
      role: "Bible Teacher"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Featured Song Buttons */}
      <FeaturedSongButtons />

      {/* Theme Song Player */}
      {homepageSettings?.is_active && homepageSettings?.theme_song_url && (
        <ThemeSongPlayer
          songUrl={homepageSettings.theme_song_url}
          title={homepageSettings.theme_song_title}
          artist={homepageSettings.theme_song_artist}
          autoplay={homepageSettings.autoplay}
        />
      )}

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-amber-700 text-sm tracking-[0.3em] uppercase font-light">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mt-4">
            Scripture Meets Melody
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group"
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-xl shadow-stone-900/5 border border-stone-100 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-3">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Chapters */}
      {featuredChapters.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-stone-800 to-stone-900 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-amber-400 text-sm tracking-[0.3em] uppercase font-light">Featured</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4">
                Popular Chapters
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-stone-700/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-600/50 hover:border-amber-500/50 transition-all duration-300 hover:bg-stone-700/70">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-white">
                          {chapter.book} {chapter.chapter_number}
                        </h3>
                        <p className="text-amber-400/80 text-sm">{chapter.era}</p>
                      </div>
                      {chapter.youtube_link && (
                        <a
                          href={chapter.youtube_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors group-hover:scale-110"
                        >
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </a>
                      )}
                    </div>
                    {chapter.song_title && (
                      <div className="flex items-center gap-2 text-stone-300">
                        <Music2 className="w-4 h-4" />
                        <span className="text-sm truncate">{chapter.song_title}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to={createPageUrl('BibleTimeline')}>
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8">
                  Explore All Chapters
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-amber-700 text-sm tracking-[0.3em] uppercase font-light">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mt-4">
            Voices of Faith
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-stone-900/5 border border-stone-100 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-600 italic flex-1 leading-relaxed">"{testimonial.quote}"</p>
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <p className="font-bold text-stone-800">{testimonial.author}</p>
                  <p className="text-amber-700 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products CTA */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-amber-700 text-sm tracking-[0.3em] uppercase font-light">Shop</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mt-4">
                Faith-Inspired Products
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-stone-900/5 group hover:shadow-xl transition-shadow">
                    <div className="aspect-square bg-stone-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-stone-800 truncate">{product.name}</h3>
                      <p className="text-amber-700 font-bold">${product.price?.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to={createPageUrl('Store')}>
                <Button size="lg" variant="outline" className="border-2 border-amber-700 text-amber-800 hover:bg-amber-700 hover:text-white rounded-full px-8">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Visit Store
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                Begin Your Musical Journey Through Scripture
              </h2>
              <p className="text-stone-300 text-lg mb-8 max-w-2xl mx-auto">
                Discover how music can deepen your connection to God's Word. 
                Explore our chronological Bible timeline with curated songs for every chapter.
              </p>
              <Link to={createPageUrl('BibleTimeline')}>
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full px-10 py-6 text-lg shadow-xl shadow-amber-500/30">
                  <BookOpen className="w-6 h-6 mr-3" />
                  Start Exploring
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Community Feedback Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <CommentSection pageReference="home" />
      </section>
    </div>
  );
}