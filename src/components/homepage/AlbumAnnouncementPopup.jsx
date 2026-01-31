import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AlbumAnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Check if popup was shown today
    const lastShown = localStorage.getItem('albumAnnouncementLastShown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      // Show popup after a brief delay
      setTimeout(() => setIsVisible(true), 500);
      
      // Allow closing after 3 seconds
      setTimeout(() => setCanClose(true), 3000);
      
      // Mark as shown today
      localStorage.setItem('albumAnnouncementLastShown', today);
    }
  }, []);

  const handleClose = () => {
    if (canClose) {
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-2xl"
          >
            <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500/30">
              {/* Close Button */}
              {canClose && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleClose}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}

              {/* Album Cover */}
              <div className="relative aspect-square md:aspect-video overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696bc87ced3165f403f5ebd9/4de5ca6c2_image97.jpg"
                  alt="Kings and Judges Album Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Music2 className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">
                      New Album Release
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
                    Kings and Judges
                  </h2>

                  <p className="text-white/90 text-lg md:text-xl mb-2">
                    GoodGodMusics
                  </p>

                  <p className="text-amber-300 font-bold text-xl md:text-2xl mb-6">
                    Coming February 7th, 2026
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="https://youtube.com/@goodgodmusics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                        <Play className="w-5 h-5 mr-2 fill-white" />
                        Listen on YouTube
                      </Button>
                    </a>
                    <a
                      href="https://open.spotify.com/artist/goodgodmusics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                        <Music2 className="w-5 h-5 mr-2" />
                        Stream on Spotify
                      </Button>
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}