import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TagInput({ tags, onChange, suggestions = [], placeholder = "Add tags..." }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[42px]">
        {tags.map((tag) => (
          <Badge key={tag} className="bg-amber-100 text-amber-800 pr-1">
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-amber-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-none shadow-none focus-visible:ring-0 p-0 h-auto"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="border rounded-lg bg-white shadow-lg p-2 space-y-1">
          <p className="text-xs text-stone-500 px-2 py-1">Suggestions:</p>
          {filteredSuggestions.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-stone-100 text-sm flex items-center justify-between"
            >
              {suggestion}
              <Plus className="w-3 h-3 text-stone-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}