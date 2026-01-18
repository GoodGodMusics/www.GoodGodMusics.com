import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp, MessageCircle, Pin, Lock, Send, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Forums() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  // New post form state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'discussion',
    tags: ''
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 500)
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['forumReplies', selectedPost?.id],
    queryFn: () => {
      if (!selectedPost) return [];
      return base44.entities.ForumReply.filter({ post_id: selectedPost.id }, '-created_date');
    },
    enabled: !!selectedPost
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      return base44.entities.ForumPost.create({
        ...postData,
        author_email: currentUser.email,
        author_name: currentUser.full_name,
        tags: postData.tags ? postData.tags.split(',').map(t => t.trim()) : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', category: 'discussion', tags: '' });
    }
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      await base44.entities.ForumReply.create({
        post_id: postId,
        author_email: currentUser.email,
        author_name: currentUser.full_name,
        content
      });
      // Update reply count
      const post = posts.find(p => p.id === postId);
      await base44.entities.ForumPost.update(postId, {
        replies_count: (post.replies_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      queryClient.invalidateQueries({ queryKey: ['forumReplies'] });
      setReplyText('');
    }
  });

  const handleCreatePost = (e) => {
    e.preventDefault();
    createPostMutation.mutate(newPost);
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (replyText.trim() && selectedPost) {
      createReplyMutation.mutate({ postId: selectedPost.id, content: replyText });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryColors = {
    prayer_request: 'bg-purple-100 text-purple-800',
    question: 'bg-blue-100 text-blue-800',
    testimony: 'bg-green-100 text-green-800',
    feedback: 'bg-yellow-100 text-yellow-800',
    discussion: 'bg-stone-100 text-stone-800',
    tribulation: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">
            Community Forums
          </h1>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            Share your questions, testimonies, prayer requests, and connect with fellow believers
          </p>
        </motion.div>

        {/* Filters & Create Button */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border-stone-300"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="prayer_request">Prayer Requests</SelectItem>
              <SelectItem value="question">Questions</SelectItem>
              <SelectItem value="testimony">Testimonies</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="discussion">Discussions</SelectItem>
              <SelectItem value="tribulation">Tribulations</SelectItem>
            </SelectContent>
          </Select>
          {currentUser && (
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="bg-amber-600 hover:bg-amber-700 w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {showCreatePost && currentUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Create New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Input
                    placeholder="Post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    required
                  />
                  <Textarea
                    placeholder="Share your thoughts, questions, or prayer requests..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    rows={6}
                    required
                  />
                  <div className="flex gap-4">
                    <Select value={newPost.category} onValueChange={(val) => setNewPost({...newPost, category: val})}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prayer_request">Prayer Request</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="testimony">Testimony</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="tribulation">Tribulation</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={newPost.tags}
                      onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreatePost(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Posts List */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Posts */}
          <div className="md:col-span-2 space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-stone-400 animate-pulse mx-auto mb-4" />
                <p className="text-stone-500">Loading discussions...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-stone-500">No posts found. Be the first to start a discussion!</p>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedPost(post)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {post.is_pinned && <Pin className="w-4 h-4 text-amber-600" />}
                            {post.is_locked && <Lock className="w-4 h-4 text-stone-400" />}
                            <Badge className={categoryColors[post.category]}>
                              {post.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-stone-800 mb-2">{post.title}</h3>
                          <p className="text-stone-600 line-clamp-2">{post.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-stone-500">
                        <span>by {post.author_name}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.replies_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes_count || 0}
                          </div>
                        </div>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Selected Post Details */}
          <div className="md:col-span-1">
            {selectedPost ? (
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedPost.title}</CardTitle>
                  <Badge className={categoryColors[selectedPost.category]}>
                    {selectedPost.category.replace('_', ' ')}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-700">{selectedPost.content}</p>
                    <p className="text-xs text-stone-500 mt-2">
                      Posted by {selectedPost.author_name}
                    </p>
                  </div>

                  {/* Replies */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Replies ({replies.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {replies.map(reply => (
                        <div key={reply.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-sm text-stone-700">{reply.content}</p>
                          <p className="text-xs text-stone-500 mt-1">— {reply.author_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {currentUser && !selectedPost.is_locked && (
                    <form onSubmit={handleReply} className="space-y-3">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={createReplyMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-24">
                <CardContent className="p-12 text-center text-stone-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a post to view details and replies</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}