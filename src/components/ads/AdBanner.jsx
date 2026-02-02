import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdBanner({ spaceName, size = '300x250', className = '' }) {
  const [currentAd, setCurrentAd] = useState(null);

  // Fetch ad space configuration
  const { data: adSpace } = useQuery({
    queryKey: ['adSpace', spaceName],
    queryFn: async () => {
      const spaces = await base44.entities.AdSpace.filter({ space_name: spaceName });
      return spaces[0] || null;
    }
  });

  // Fetch active ads for this space
  const { data: ads = [] } = useQuery({
    queryKey: ['adContent', size],
    queryFn: async () => {
      const now = new Date().toISOString().split('T')[0];
      return base44.entities.AdContent.filter({ 
        ad_size: size,
        is_active: true
      });
    },
    enabled: !!adSpace
  });

  // Filter ads by date and targeting
  const activeAds = ads.filter(ad => {
    const now = new Date();
    const start = ad.start_date ? new Date(ad.start_date) : new Date('2000-01-01');
    const end = ad.end_date ? new Date(ad.end_date) : new Date('2099-12-31');
    return now >= start && now <= end;
  });

  // Select ad to display (prioritize client_paid over promos)
  useEffect(() => {
    if (activeAds.length === 0) return;
    
    const clientAds = activeAds.filter(ad => ad.ad_type === 'client_paid');
    const promoAds = activeAds.filter(ad => ad.ad_type === 'goodgodmusics_promo');
    
    // Prioritize client ads, fallback to promos
    const selectedAd = clientAds.length > 0 
      ? clientAds[Math.floor(Math.random() * clientAds.length)]
      : promoAds.length > 0 
        ? promoAds[Math.floor(Math.random() * promoAds.length)]
        : activeAds[0];
    
    setCurrentAd(selectedAd);
  }, [activeAds]);

  const trackImpression = async () => {
    if (!currentAd) return;
    try {
      await base44.entities.AdContent.update(currentAd.id, {
        impressions: (currentAd.impressions || 0) + 1
      });
      base44.analytics.track({
        eventName: 'ad_impression',
        properties: {
          ad_id: currentAd.id,
          ad_name: currentAd.ad_name,
          ad_type: currentAd.ad_type,
          space_name: spaceName
        }
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async () => {
    if (!currentAd) return;
    try {
      await base44.entities.AdContent.update(currentAd.id, {
        clicks: (currentAd.clicks || 0) + 1
      });
      base44.analytics.track({
        eventName: 'ad_click',
        properties: {
          ad_id: currentAd.id,
          ad_name: currentAd.ad_name,
          ad_type: currentAd.ad_type,
          space_name: spaceName
        }
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  useEffect(() => {
    if (currentAd) {
      trackImpression();
    }
  }, [currentAd?.id]);

  if (!adSpace?.is_active || !currentAd) {
    return null;
  }

  const sizeClasses = {
    '300x250': 'w-[300px] h-[250px]',
    '728x90': 'w-full max-w-[728px] h-[90px]',
    '160x600': 'w-[160px] h-[600px]',
    '300x600': 'w-[300px] h-[600px]',
    '320x50': 'w-full max-w-[320px] h-[50px]',
    '970x90': 'w-full max-w-[970px] h-[90px]'
  };

  const isPromo = currentAd.ad_type === 'goodgodmusics_promo';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-xl`}
    >
      <a
        href={currentAd.destination_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackClick}
        className="block w-full h-full group"
      >
        {/* Background gradient for promos */}
        {isPromo && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10" />
        )}

        {/* Image background if provided */}
        {currentAd.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ backgroundImage: `url(${currentAd.image_url})` }}
          />
        )}

        {/* Content overlay */}
        <div className="relative w-full h-full p-4 flex flex-col justify-between bg-gradient-to-t from-black/60 to-transparent">
          {isPromo && (
            <div className="flex items-center gap-1 text-amber-300 text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </div>
          )}

          <div className="space-y-2">
            {currentAd.headline && (
              <h3 className="text-white font-bold text-lg leading-tight">
                {currentAd.headline}
              </h3>
            )}
            {currentAd.body_text && (
              <p className="text-white/90 text-sm line-clamp-2">
                {currentAd.body_text}
              </p>
            )}
          </div>

          {currentAd.cta_text && (
            <Button 
              size="sm" 
              className="bg-white/90 text-amber-700 hover:bg-white w-fit"
            >
              {currentAd.cta_text}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Border for brand consistency */}
        <div className="absolute inset-0 border-2 border-amber-200/30 rounded-xl pointer-events-none" />
      </a>

      {/* "Advertisement" label */}
      <div className="absolute top-1 right-1 text-[10px] text-white/50 bg-black/20 px-2 py-0.5 rounded">
        Ad
      </div>
    </motion.div>
  );
}