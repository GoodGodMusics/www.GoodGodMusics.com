import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Star, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommentSection({ pageReference = 'general' }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    message: '',
    comment_type: 'feedback',
    rating: 5
  });

  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', pageReference],
    queryFn: () => base44.entities.Comment.filter({ 
      page_reference: pageReference,
      is_approved: true 
    }, '-created_date', 50)
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsFormOpen(false);
        setFormData({
          user_name: '',
          user_email: '',
          message: '',
          comment_type: 'feedback',
          rating: 5
        });
      }, 2000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCommentMutation.mutate({
      ...formData,
      page_reference: pageReference
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">Community Feedback</h2>
              <p className="text-stone-300 text-sm">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {!isFormOpen && (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Leave Feedback
            </Button>
          )}
        </div>
      </div>

      {/* Comment Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-stone-200"
          >
            {isSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">Thank You!</h3>
                <p className="text-stone-600">Your feedback has been submitted for review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      value={formData.user_name}
                      onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={formData.user_email}
                      onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Feedback Type</Label>
                    <Select 
                      value={formData.comment_type}
                      onValueChange={(value) => setFormData({...formData, comment_type: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feedback">General Feedback</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="testimony">Testimony</SelectItem>
                        <SelectItem value="general">General Comment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFormData({...formData, rating})}
                          className="transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              rating <= formData.rating 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Your Message *</Label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Share your thoughts, suggestions, or testimony..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <p className="text-xs text-stone-500">
                  * Your feedback will be reviewed by our team before being published.
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCommentMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    {createCommentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No feedback yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-stone-50 rounded-2xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-stone-800">
                      {comment.user_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(comment.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {comment.rating && (
                    <div className="flex gap-0.5">
                      {[...Array(comment.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-stone-600 leading-relaxed">{comment.message}</p>
                {comment.admin_reply && (
                  <div className="mt-3 pl-4 border-l-2 border-amber-500 bg-amber-50 p-3 rounded">
                    <p className="text-xs font-medium text-amber-800 mb-1">Response from Bible Harmony Team:</p>
                    <p className="text-sm text-stone-700">{comment.admin_reply}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}