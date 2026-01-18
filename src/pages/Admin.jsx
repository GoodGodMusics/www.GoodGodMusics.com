import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Music2, Edit, Save, X, Search, 
  Loader2, Check, AlertCircle, Link2, MessageSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChapter, setEditingChapter] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  // Check if user is admin
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    };
    checkUser();
  }, []);

  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['adminChapters'],
    queryFn: () => base44.entities.BibleChapter.list('chronological_order', 1500),
    enabled: user?.role === 'admin'
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['adminComments'],
    queryFn: () => base44.entities.Comment.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BibleChapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminChapters'] });
      queryClient.invalidateQueries({ queryKey: ['bibleChapters'] });
      setEditingChapter(null);
      setEditData({});
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Comment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminComments'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminComments'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });

  const filteredChapters = chapters.filter(chapter => 
    !searchQuery || 
    chapter.book?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${chapter.book} ${chapter.chapter_number}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (chapter) => {
    setEditingChapter(chapter.id);
    setEditData({
      youtube_link: chapter.youtube_link || '',
      song_title: chapter.song_title || '',
      song_artist: chapter.song_artist || ''
    });
  };

  const handleSaveEdit = () => {
    updateChapterMutation.mutate({
      id: editingChapter,
      data: editData
    });
  };

  const pendingComments = comments.filter(c => !c.is_approved);
  const approvedComments = comments.filter(c => c.is_approved);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Admin Dashboard</h1>
              <p className="text-stone-500">Manage Bible chapters and user feedback</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chapters" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Bible Chapters ({chapters.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({pendingComments.length} pending)
            </TabsTrigger>
          </TabsList>

          {/* Chapters Tab */}
          <TabsContent value="chapters">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Search */}
              <div className="p-6 border-b border-stone-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    placeholder="Search chapters (e.g., Genesis 1, John 3)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 py-3 rounded-full"
                  />
                </div>
              </div>

              {/* Chapters List */}
              <div className="overflow-x-auto">
                {loadingChapters ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredChapters.map((chapter) => (
                      <motion.div
                        key={chapter.id}
                        className="p-6 border-b border-stone-100 hover:bg-stone-50 transition-colors"
                      >
                        {editingChapter === chapter.id ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-stone-800">
                                {chapter.book} {chapter.chapter_number}
                              </h3>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingChapter(null);
                                    setEditData({});
                                  }}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={updateChapterMutation.isPending}
                                  className="bg-amber-600 hover:bg-amber-700"
                                >
                                  {updateChapterMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-stone-700 mb-1 block">
                                YouTube Link
                              </label>
                              <Input
                                value={editData.youtube_link}
                                onChange={(e) => setEditData({...editData, youtube_link: e.target.value})}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-stone-700 mb-1 block">
                                  Song Title
                                </label>
                                <Input
                                  value={editData.song_title}
                                  onChange={(e) => setEditData({...editData, song_title: e.target.value})}
                                  placeholder="Song name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-stone-700 mb-1 block">
                                  Artist
                                </label>
                                <Input
                                  value={editData.song_artist}
                                  onChange={(e) => setEditData({...editData, song_artist: e.target.value})}
                                  placeholder="Artist name"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-stone-800">
                                  {chapter.book} {chapter.chapter_number}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {chapter.era}
                                </Badge>
                                {chapter.youtube_link && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Music2 className="w-3 h-3 mr-1" />
                                    Has Music
                                  </Badge>
                                )}
                              </div>
                              {chapter.song_title && (
                                <p className="text-stone-600 text-sm mb-1">
                                  <strong>Song:</strong> {chapter.song_title}
                                  {chapter.song_artist && ` by ${chapter.song_artist}`}
                                </p>
                              )}
                              {chapter.youtube_link ? (
                                <a 
                                  href={chapter.youtube_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-600 hover:text-amber-700 text-sm flex items-center gap-1"
                                >
                                  <Link2 className="w-3 h-3" />
                                  {chapter.youtube_link.substring(0, 50)}...
                                </a>
                              ) : (
                                <p className="text-stone-400 text-sm">No YouTube link set</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(chapter)}
                              className="flex-shrink-0"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="space-y-6">
              {/* Pending Comments */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-yellow-50 border-b border-yellow-100 p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h2 className="font-bold text-stone-800">Pending Approval ({pendingComments.length})</h2>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {loadingComments ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                    </div>
                  ) : pendingComments.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      No pending comments
                    </div>
                  ) : (
                    pendingComments.map((comment) => (
                      <div key={comment.id} className="p-6 border-b border-stone-100">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-stone-800">{comment.user_name || 'Anonymous'}</p>
                            <p className="text-sm text-stone-500">{comment.user_email}</p>
                            {comment.page_reference && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {comment.page_reference}
                              </Badge>
                            )}
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {comment.comment_type}
                          </Badge>
                        </div>
                        <p className="text-stone-600 mb-4">{comment.message}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateCommentMutation.mutate({
                              id: comment.id,
                              data: { is_approved: true }
                            })}
                            disabled={updateCommentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Approved Comments */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-green-50 border-b border-green-100 p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <h2 className="font-bold text-stone-800">Approved Comments ({approvedComments.length})</h2>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {approvedComments.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      No approved comments yet
                    </div>
                  ) : (
                    approvedComments.map((comment) => (
                      <div key={comment.id} className="p-6 border-b border-stone-100">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-stone-800">{comment.user_name || 'Anonymous'}</p>
                            <p className="text-sm text-stone-500">
                              {new Date(comment.created_date).toLocaleDateString()}
                            </p>
                            {comment.page_reference && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {comment.page_reference}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-stone-600">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}