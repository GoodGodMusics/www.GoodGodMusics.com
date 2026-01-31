import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AlbumAnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [activePopup, setActivePopup] = useState(null);

  const { data: popups = [] } = useQuery({
    queryKey: ['activePromotionalPopups'],
    queryFn: async () => {
      const allPopups = await base44.entities.PromotionalPopup.filter({ is_active: true }, '-priority', 10);
      
      // Filter by date range
      const now = new Date();
      return allPopups.filter(popup => {
        if (popup.start_date && new Date(popup.start_date) > now) return false;
        if (popup.end_date && new Date(popup.end_date) < now) return false;
        return true;
      });
    }
  });

  useEffect(() => {
    if (popups.length === 0) return;

    // Get highest priority popup
    const popup = popups[0];
    setActivePopup(popup);

    // Check if popup should be shown based on frequency
    const storageKey = `popup_${popup.id}_lastShown`;
    const lastShown = localStorage.getItem(storageKey);
    
    let shouldShow = false;
    
    switch (popup.show_frequency) {
      case 'once_per_day':
        shouldShow = lastShown !== new Date().toDateString();
        break;
      case 'once_per_session':
        shouldShow = !sessionStorage.getItem(storageKey);
        break;
      case 'once_ever':
        shouldShow = !lastShown;
        break;
      case 'always':
        shouldShow = true;
        break;
      default:
        shouldShow = false;
    }

    if (shouldShow) {
      const delay = (popup.delay_seconds || 0.5) * 1000;
      const minCloseTime = (popup.min_close_time || 3) * 1000;

      setTimeout(() => setIsVisible(true), delay);
      setTimeout(() => setCanClose(true), delay + minCloseTime);
      
      // Mark as shown
      if (popup.show_frequency === 'once_per_day' || popup.show_frequency === 'once_ever') {
        localStorage.setItem(storageKey, new Date().toDateString());
      }
      if (popup.show_frequency === 'once_per_session') {
        sessionStorage.setItem(storageKey, 'true');
      }
    }
  }, [popups]);

  const handleClose = () => {
    if (canClose) {
      setIsVisible(false);
    }
  };

  if (!activePopup) return null;

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

              {/* Cover Image */}
              <div className="relative aspect-square md:aspect-video overflow-hidden">
                {activePopup.image_url ? (
                  <img
                    src={activePopup.image_url}
                    alt={activePopup.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-900 to-stone-900 flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-white/40" />
                  </div>
                )}
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
                      {activePopup.popup_type.replace('_', ' ')}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
                    {activePopup.title}
                  </h2>

                  {activePopup.subtitle && (
                    <p className="text-white/90 text-lg md:text-xl mb-2">
                      {activePopup.subtitle}
                    </p>
                  )}

                  {activePopup.announcement_text && (
                    <p className="text-amber-300 font-bold text-xl md:text-2xl mb-3">
                      {activePopup.announcement_text}
                    </p>
                  )}

                  {activePopup.description && (
                    <p className="text-white/80 text-sm md:text-base mb-6">
                      {activePopup.description}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {activePopup.youtube_link && (
                      <a
                        href={activePopup.youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                          <Play className="w-5 h-5 mr-2 fill-white" />
                          YouTube
                        </Button>
                      </a>
                    )}
                    {activePopup.spotify_link && (
                      <a
                        href={activePopup.spotify_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                          <Music2 className="w-5 h-5 mr-2" />
                          Spotify
                        </Button>
                      </a>
                    )}
                    {activePopup.custom_link_1_url && activePopup.custom_link_1_label && (
                      <a
                        href={activePopup.custom_link_1_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                          <ExternalLink className="w-5 h-5 mr-2" />
                          {activePopup.custom_link_1_label}
                        </Button>
                      </a>
                    )}
                    {activePopup.custom_link_2_url && activePopup.custom_link_2_label && (
                      <a
                        href={activePopup.custom_link_2_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                          <ExternalLink className="w-5 h-5 mr-2" />
                          {activePopup.custom_link_2_label}
                        </Button>
                      </a>
                    )}
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