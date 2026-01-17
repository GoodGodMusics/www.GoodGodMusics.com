import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Link2, User, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

export default function SuggestSongModal({ chapter, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    suggested_song: '',
    artist: '',
    youtube_link: '',
    reason: '',
    submitter_email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await base44.entities.SongSuggestion.create({
      ...formData,
      chapter_id: chapter.id,
      book_chapter: `${chapter.book} ${chapter.chapter_number}`,
      status: 'pending'
    });

    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setFormData({
        suggested_song: '',
        artist: '',
        youtube_link: '',
        reason: '',
        submitter_email: ''
      });
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-lg bg-gradient-to-br from-amber-50 to-stone-50 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-stone-800 to-stone-700 p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white">Suggest a Song</h2>
                  <p className="text-amber-200/70 text-sm">
                    for {chapter?.book} {chapter?.chapter_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">Thank You!</h3>
                <p className="text-stone-600">Your suggestion has been submitted for review.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Label className="text-stone-700 flex items-center gap-2 mb-2">
                    <Music className="w-4 h-4" />
                    Song Title *
                  </Label>
                  <Input
                    required
                    value={formData.suggested_song}
                    onChange={(e) => setFormData({...formData, suggested_song: e.target.value})}
                    placeholder="Enter the song title"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <Label className="text-stone-700 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Artist
                  </Label>
                  <Input
                    value={formData.artist}
                    onChange={(e) => setFormData({...formData, artist: e.target.value})}
                    placeholder="Artist or band name"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <Label className="text-stone-700 flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4" />
                    YouTube Link *
                  </Label>
                  <Input
                    required
                    type="url"
                    value={formData.youtube_link}
                    onChange={(e) => setFormData({...formData, youtube_link: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <Label className="text-stone-700 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Why does this song fit?
                  </Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Tell us why this song matches the chapter's themes..."
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-stone-700 mb-2">Your Email (optional)</Label>
                  <Input
                    type="email"
                    value={formData.submitter_email}
                    onChange={(e) => setFormData({...formData, submitter_email: e.target.value})}
                    placeholder="your@email.com"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-6 rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Suggestion
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}