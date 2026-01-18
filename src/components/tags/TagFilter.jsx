import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TagFilter({ allTags, selectedTags, onTagToggle, onClearAll, placeholder = "Search tags..." }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique tags and their counts
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .map(([tag]) => tag);

  const filteredTags = sortedTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedTags = isExpanded ? filteredTags : filteredTags.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedTags.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({selectedTags.length})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {displayedTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                  onClick={() => onTagToggle(tag)}
                >
                  {tag}
                  <span className="ml-1 text-xs opacity-70">({tagCounts[tag]})</span>
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTags.length > 12 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show {filteredTags.length - 12} More Tags
            </>
          )}
        </Button>
      )}

      {filteredTags.length === 0 && searchQuery && (
        <p className="text-sm text-stone-500 text-center py-4">
          No tags found matching "{searchQuery}"
        </p>
      )}
    </div>
  );
}