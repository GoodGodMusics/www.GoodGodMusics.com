import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Play, Heart, Book, Cross, Star, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ThemeRadio() {
  const radioStations = [
    {
      id: 'worship',
      name: 'Worship & Praise',
      description: 'Uplifting songs of adoration',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      themes: ['worship', 'praise', 'adoration']
    },
    {
      id: 'psalms',
      name: 'Psalms Radio',
      description: 'Songs from the book of Psalms',
      icon: Book,
      color: 'from-blue-500 to-indigo-600',
      themes: ['psalms', 'poetry', 'lament']
    },
    {
      id: 'hope',
      name: 'Hope & Faith',
      description: 'Encouraging messages of hope',
      icon: Sun,
      color: 'from-amber-500 to-orange-600',
      themes: ['hope', 'faith', 'trust']
    },
    {
      id: 'redemption',
      name: 'Redemption',
      description: 'Songs of salvation and grace',
      icon: Cross,
      color: 'from-purple-500 to-violet-600',
      themes: ['redemption', 'salvation', 'grace']
    },
    {
      id: 'prophets',
      name: 'Prophetic Era',
      description: 'Music from prophetic books',
      icon: Star,
      color: 'from-green-500 to-emerald-600',
      themes: ['prophecy', 'vision', 'revelation']
    },
    {
      id: 'gospels',
      name: 'Gospel Stories',
      description: 'Life and teachings of Jesus',
      icon: Book,
      color: 'from-red-500 to-pink-600',
      themes: ['gospel', 'jesus', 'teachings']
    }
  ];

  const handlePlayStation = (station) => {
    // This would trigger playing songs matching the station's themes
    console.log(`Playing ${station.name} radio...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center shadow-lg">
          <Radio className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-800">Theme Radio Stations</h2>
          <p className="text-stone-500 text-sm">Curated continuous playlists by biblical themes</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {radioStations.map((station, index) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-stone-100 hover:border-stone-200 overflow-hidden"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${station.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${station.color} flex items-center justify-center shadow-md`}>
                  <station.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className="text-xs">
                  <Radio className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-stone-800 mb-1">
                {station.name}
              </h3>
              <p className="text-stone-600 text-sm mb-4">
                {station.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {station.themes.map((theme, i) => (
                  <Badge key={i} variant="outline" className="text-xs capitalize">
                    {theme}
                  </Badge>
                ))}
              </div>

              <Button
                onClick={() => handlePlayStation(station)}
                className={`w-full bg-gradient-to-r ${station.color} hover:opacity-90 text-white`}
                size="sm"
              >
                <Play className="w-4 h-4 mr-2 fill-white" />
                Play Station
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}