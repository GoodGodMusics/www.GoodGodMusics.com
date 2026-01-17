import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookMarked, Scroll } from 'lucide-react';
import ChapterCard from './ChapterCard';

export default function EraSection({ era, chapters, onSuggestSong }) {
  const [isOpen, setIsOpen] = useState(false);

  const eraIcons = {
    'Creation': '🌍',
    'Patriarchs': '👴',
    'Egypt & Exodus': '🔥',
    'Wilderness': '🏜️',
    'Conquest': '⚔️',
    'Judges': '⚖️',
    'United Kingdom': '👑',
    'Divided Kingdom': '🏰',
    'Exile': '⛓️',
    'Return': '🏠',
    'Intertestamental': '📜',
    'Gospels': '✝️',
    'Early Church': '⛪',
    'Epistles': '✉️',
    'Apocalypse': '🌟'
  };

  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Era Header */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between p-6
          bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800
          hover:from-stone-700 hover:via-stone-600 hover:to-stone-700
          rounded-2xl transition-all duration-300
          border border-amber-900/20
          shadow-lg shadow-stone-900/20
          group
        `}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center gap-4">
          {/* Era Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
            {eraIcons[era] || <Scroll className="w-6 h-6 text-white" />}
          </div>
          
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
              {era}
            </h2>
            <p className="text-amber-200/60 text-sm">
              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center"
        >
          <ChevronDown className="w-6 h-6 text-amber-300" />
        </motion.div>
      </motion.button>

      {/* Chapters Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ChapterCard 
                    chapter={chapter} 
                    onSuggestSong={onSuggestSong}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}