import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DonationButton({ variant = 'default', size = 'default', className = '' }) {
  // PayPal donation link for GoodGodMusics / DistroKid
  const paypalLink = "https://www.paypal.com/donate/?business=GOODGODMUSICS@EMAIL.COM";
  
  // Note: Replace GOODGODMUSICS@EMAIL.COM with actual PayPal business email
  
  const handleDonate = () => {
    window.open(paypalLink, '_blank', 'noopener,noreferrer');
    
    // Track donation click
    try {
      base44.analytics.track({
        eventName: 'donation_button_clicked',
        properties: { 
          source: window.location.pathname,
          variant: variant 
        }
      });
    } catch (error) {
      // Analytics is optional
    }
  };

  if (variant === 'inline') {
    return (
      <motion.button
        onClick={handleDonate}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium shadow-lg shadow-pink-500/30 transition-all ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Heart className="w-5 h-5 fill-white" />
        <span>Support Our Ministry</span>
        <ExternalLink className="w-4 h-4" />
      </motion.button>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.button
        onClick={handleDonate}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-2xl shadow-pink-500/40 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <Heart className="w-6 h-6 fill-white animate-pulse" />
        <span className="absolute right-full mr-3 px-3 py-1 bg-stone-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Support Us
        </span>
      </motion.button>
    );
  }

  return (
    <Button
      onClick={handleDonate}
      size={size}
      className={`bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30 ${className}`}
    >
      <Heart className="w-4 h-4 mr-2 fill-white" />
      Donate
      <ExternalLink className="w-3 h-3 ml-2" />
    </Button>
  );
}