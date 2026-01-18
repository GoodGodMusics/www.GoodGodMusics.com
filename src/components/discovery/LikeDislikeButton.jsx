import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export default function LikeDislikeButton({ chapter, song, size = 'default' }) {
  const [userId, setUserId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUserId = async () => {
      try {
        const user = await base44.auth.me();
        setUserId(user.email);
      } catch {
        const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
        localStorage.setItem('sessionId', sessionId);
        setUserId(sessionId);
      }
    };
    getUserId();
  }, []);

  // Get user's interaction with this song
  const { data: interactions = [] } = useQuery({
    queryKey: ['songInteraction', userId, chapter?.id || song?.id],
    queryFn: async () => {
      if (!userId) return [];
      const query = chapter 
        ? { user_email: userId, chapter_id: chapter.id, interaction_type: { $in: ['liked', 'disliked'] } }
        : { user_email: userId, song_title: song?.title, interaction_type: { $in: ['liked', 'disliked'] } };
      return base44.entities.UserInteraction.filter(query);
    },
    enabled: !!userId && !!(chapter || song)
  });

  const currentInteraction = interactions[0];
  const isLiked = currentInteraction?.interaction_type === 'liked';
  const isDisliked = currentInteraction?.interaction_type === 'disliked';

  const likeMutation = useMutation({
    mutationFn: async (type) => {
      if (!userId) return;
      
      // Delete existing interaction if any
      if (currentInteraction) {
        await base44.entities.UserInteraction.delete(currentInteraction.id);
      }
      
      // If toggling the same type, just delete (unlike/undislike)
      if ((type === 'liked' && isLiked) || (type === 'disliked' && isDisliked)) {
        return;
      }
      
      // Create new interaction
      await base44.entities.UserInteraction.create({
        user_email: userId,
        interaction_type: type,
        chapter_id: chapter?.id,
        chapter_reference: chapter ? `${chapter.book} ${chapter.chapter_number}` : null,
        song_title: chapter?.song_title || song?.title,
        song_artist: chapter?.song_artist || song?.artist,
        youtube_link: chapter?.youtube_link || song?.youtube_link,
        themes: chapter?.era ? [chapter.era] : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songInteraction'] });
      queryClient.invalidateQueries({ queryKey: ['userInteractions'] });
    }
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isLiked ? "default" : "ghost"}
        size={size}
        onClick={() => likeMutation.mutate('liked')}
        className={isLiked ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
      >
        <motion.div
          whileTap={{ scale: 1.2 }}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'text-white fill-white' : 'text-green-600'}`} />
        </motion.div>
      </Button>
      <Button
        variant={isDisliked ? "default" : "ghost"}
        size={size}
        onClick={() => likeMutation.mutate('disliked')}
        className={isDisliked ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50"}
      >
        <motion.div
          whileTap={{ scale: 1.2 }}
        >
          <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'text-white fill-white' : 'text-red-600'}`} />
        </motion.div>
      </Button>
    </div>
  );
}