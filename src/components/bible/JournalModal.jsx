import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookHeart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function JournalModal({ isOpen, onClose, chapter, userEmail }) {
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');
  const [mood, setMood] = useState('reflective');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Journal.create({
        user_email: userEmail,
        chapter_id: chapter.id,
        chapter_reference: `${chapter.book} ${chapter.chapter_number}`,
        reflection_title: title || `Reflection on ${chapter.book} ${chapter.chapter_number}`,
        reflection_text: reflection,
        mood,
        tags: [chapter.era, chapter.testament],
        is_private: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      setTitle('');
      setReflection('');
      setMood('reflective');
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BookHeart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white">Journal Entry</h2>
                  <p className="text-white/80 text-sm">{chapter.book} {chapter.chapter_number}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Reflection Title (Optional)
              </label>
              <Input
                placeholder="My insights on this chapter..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Your Reflection *
              </label>
              <Textarea
                placeholder="What did this chapter speak to you? How does it apply to your life? What did you learn?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Spiritual Mood
              </label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grateful">😊 Grateful</SelectItem>
                  <SelectItem value="hopeful">🌟 Hopeful</SelectItem>
                  <SelectItem value="peaceful">🕊️ Peaceful</SelectItem>
                  <SelectItem value="challenged">💪 Challenged</SelectItem>
                  <SelectItem value="inspired">✨ Inspired</SelectItem>
                  <SelectItem value="reflective">🤔 Reflective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!reflection.trim() || saveMutation.isLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isLoading ? 'Saving...' : 'Save Reflection'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}