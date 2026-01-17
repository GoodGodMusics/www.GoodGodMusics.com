import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Play, BookOpen, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100" />
      
      {/* Animated parchment texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Glowing light rays */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-amber-200/40 via-transparent to-transparent rounded-full blur-3xl" />
      </motion.div>
      
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 opacity-20"
        animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <circle cx="50" cy="50" r="45" stroke="#8B5A2B" strokeWidth="1" strokeDasharray="4 4"/>
          <path d="M30 50 L70 50 M50 30 L50 70" stroke="#D4A574" strokeWidth="2"/>
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 right-10 w-24 h-24 opacity-20"
        animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <ellipse cx="50" cy="60" rx="15" ry="12" fill="#8B5A2B"/>
          <path d="M65 60 L65 25 C65 20 80 18 80 25" stroke="#8B5A2B" strokeWidth="4"/>
        </svg>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Decorative top element */}
          <div className="flex justify-center mb-8">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
          </div>
          
          <motion.span 
            className="inline-block text-amber-700/80 text-sm md:text-base tracking-[0.4em] uppercase font-light mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Experience Scripture Through Song
          </motion.span>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 leading-tight">
            <span className="block" style={{
              background: 'linear-gradient(135deg, #5D3A1A 0%, #8B5A2B 30%, #D4A574 50%, #8B5A2B 70%, #5D3A1A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Bible Harmony
            </span>
          </h1>
          
          <motion.p 
            className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Journey through the Word of God with curated music for every chapter. 
            Discover the perfect soundtrack to deepen your biblical experience.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link to={createPageUrl('BibleTimeline')}>
              <Button 
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-800 hover:via-amber-700 hover:to-amber-800 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-amber-900/20 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  Explore Chapters
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </Link>
            
            <Link to={createPageUrl('Store')}>
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-amber-700/30 text-amber-800 hover:bg-amber-700 hover:text-white px-8 py-6 text-lg rounded-full transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                Visit Store
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-amber-700/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-amber-700/50 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}