import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, Users, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ForumAnalytics() {
  const { data: posts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 500)
  });

  // Calculate analytics
  const totalPosts = posts.length;
  const totalReplies = posts.reduce((sum, p) => sum + (p.replies_count || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  
  // Most popular posts by replies
  const popularByReplies = [...posts]
    .sort((a, b) => (b.replies_count || 0) - (a.replies_count || 0))
    .slice(0, 5);

  // Most liked posts
  const popularByLikes = [...posts]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 5);

  // Category breakdown
  const categoryStats = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {});

  const categoryColors = {
    prayer_request: 'bg-purple-100 text-purple-800',
    question: 'bg-blue-100 text-blue-800',
    testimony: 'bg-green-100 text-green-800',
    feedback: 'bg-yellow-100 text-yellow-800',
    discussion: 'bg-stone-100 text-stone-800',
    tribulation: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-amber-600" />
        Forum Analytics
      </h2>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Posts</p>
                  <p className="text-3xl font-bold text-stone-800">{totalPosts}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-amber-600/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Replies</p>
                  <p className="text-3xl font-bold text-stone-800">{totalReplies}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Likes</p>
                  <p className="text-3xl font-bold text-stone-800">{totalLikes}</p>
                </div>
                <ThumbsUp className="w-10 h-10 text-green-600/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posts by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryStats).map(([category, count]) => (
              <Badge key={category} className={categoryColors[category]}>
                {category.replace('_', ' ')}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Discussions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Active Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularByReplies.slice(0, 5).map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-stone-800 truncate">{post.title}</p>
                  <p className="text-xs text-stone-500">by {post.author_name}</p>
                </div>
                <Badge variant="outline" className="ml-3">
                  {post.replies_count || 0} replies
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Liked Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Liked Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularByLikes.slice(0, 5).map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-stone-800 truncate">{post.title}</p>
                  <p className="text-xs text-stone-500">by {post.author_name}</p>
                </div>
                <Badge variant="outline" className="ml-3 bg-amber-100">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {post.likes_count || 0}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}