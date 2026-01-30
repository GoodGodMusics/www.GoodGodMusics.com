import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp, MessageCircle, Pin, Lock, Send, Search, Filter, Bell, BellOff, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ForumAnalytics from '@/components/forums/ForumAnalytics';
import TagFilter from '@/components/tags/TagFilter';
import TagInput from '@/components/tags/TagInput';
import EventBoard from '@/components/events/EventBoard';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function Forums() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
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

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['forumSubscriptions', currentUser?.email],
    queryFn: () => {
      if (!currentUser) return [];
      return base44.entities.ForumSubscription.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      // AI Moderation check
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator for a Christian community forum. Analyze the following post for inappropriate content including hate speech, profanity, spam, or non-faith-related content. 

Title: ${postData.title}
Content: ${postData.content}

Respond with a JSON object indicating if the content is appropriate and why.`,
        response_json_schema: {
          type: "object",
          properties: {
            is_appropriate: { type: "boolean" },
            reason: { type: "string" },
            severity: { type: "string", enum: ["clean", "minor", "moderate", "severe"] },
            suggested_action: { type: "string", enum: ["approve", "flag", "reject"] }
          }
        }
      });

      if (moderationResult.suggested_action === 'reject') {
        throw new Error(`Content flagged: ${moderationResult.reason}`);
      }

      const post = await base44.entities.ForumPost.create({
        ...postData,
        author_email: currentUser.email,
        author_name: currentUser.full_name,
        tags: Array.isArray(postData.tags) ? postData.tags : (postData.tags ? postData.tags.split(',').map(t => t.trim()) : []),
        moderation_flag: moderationResult.suggested_action === 'flag' ? moderationResult.reason : null
      });

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', category: 'discussion', tags: '' });
    },
    onError: (error) => {
      alert(error.message || 'Failed to create post');
    }
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      // AI Moderation for replies
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator. Check if this reply is appropriate: "${content}"`,
        response_json_schema: {
          type: "object",
          properties: {
            is_appropriate: { type: "boolean" },
            reason: { type: "string" }
          }
        }
      });

      if (!moderationResult.is_appropriate) {
        throw new Error(`Reply flagged: ${moderationResult.reason}`);
      }

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

      // Notify subscribers
      const postSubscribers = await base44.entities.ForumSubscription.filter({ 
        post_id: postId,
        notify_replies: true 
      });
      
      for (const sub of postSubscribers) {
        if (sub.user_email !== currentUser.email) {
          await base44.integrations.Core.SendEmail({
            to: sub.user_email,
            subject: `New reply on: ${post.title}`,
            body: `${currentUser.full_name} replied to the discussion "${post.title}".\n\nReply: ${content}\n\nView the discussion at Bible Harmony Forums.`
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
      queryClient.invalidateQueries({ queryKey: ['forumReplies'] });
      setReplyText('');
    },
    onError: (error) => {
      alert(error.message || 'Failed to post reply');
    }
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: async (postId) => {
      const existing = subscriptions.find(s => s.post_id === postId);
      if (existing) {
        await base44.entities.ForumSubscription.delete(existing.id);
      } else {
        const post = posts.find(p => p.id === postId);
        await base44.entities.ForumSubscription.create({
          user_email: currentUser.email,
          post_id: postId,
          post_title: post.title,
          notify_replies: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumSubscriptions'] });
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

  // Get all unique tags from posts
  const allTags = posts.reduce((tags, post) => {
    if (post.tags && Array.isArray(post.tags)) {
      tags.push(...post.tags);
    }
    return tags;
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      (post.tags && selectedTags.every(tag => post.tags.includes(tag)));
    return matchesCategory && matchesSearch && matchesTags;
  });

  const isSubscribed = (postId) => subscriptions.some(s => s.post_id === postId);

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
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
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

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <TagFilter
              allTags={allTags}
              selectedTags={selectedTags}
              onTagToggle={(tag) => {
                setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                );
              }}
              onClearAll={() => setSelectedTags([])}
              placeholder="Filter by tags..."
            />
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
                  <div className="bg-white rounded-lg border border-stone-200">
                    <ReactQuill
                      theme="snow"
                      value={newPost.content}
                      onChange={(value) => setNewPost({...newPost, content: value})}
                      placeholder="Share your thoughts, questions, or prayer requests..."
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
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
                    <div className="flex-1">
                      <TagInput
                        tags={newPost.tags ? (typeof newPost.tags === 'string' ? newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : newPost.tags) : []}
                        onChange={(tags) => setNewPost({...newPost, tags})}
                        suggestions={allTags.filter((tag, index, self) => self.indexOf(tag) === index)}
                        placeholder="Add tags..."
                      />
                    </div>
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

        {/* Tabs for Posts, Events, and Analytics */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="posts">
              <MessageSquare className="w-4 h-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Local Events
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
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
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1" onClick={() => setSelectedPost(post)}>
                        <div className="flex items-center gap-2 mb-2">
                          {post.is_pinned && <Pin className="w-4 h-4 text-amber-600" />}
                          {post.is_locked && <Lock className="w-4 h-4 text-stone-400" />}
                          {post.moderation_flag && <AlertTriangle className="w-4 h-4 text-yellow-600" title={post.moderation_flag} />}
                          <Badge className={categoryColors[post.category]}>
                            {post.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">{post.title}</h3>
                        <div className="text-stone-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                        {currentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubscriptionMutation.mutate(post.id);
                            }}
                            className="flex-shrink-0"
                          >
                            {isSubscribed(post.id) ? (
                              <Bell className="w-5 h-5 text-amber-600" />
                            ) : (
                              <BellOff className="w-5 h-5 text-stone-400" />
                            )}
                          </Button>
                        )}
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
                    <div className="text-sm text-stone-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
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
          </TabsContent>

          <TabsContent value="events">
            <EventBoard />
          </TabsContent>

          <TabsContent value="analytics">
            <ForumAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}