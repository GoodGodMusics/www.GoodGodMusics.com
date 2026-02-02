import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Music2, Edit, Save, X, Search, 
  Loader2, Check, AlertCircle, Link2, MessageSquare, Home, Radio, Megaphone, Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PopupManager from '@/components/admin/PopupManager';
import AutoImageGenerator from '@/components/admin/AutoImageGenerator';
import EmailCampaignManager from '@/components/admin/EmailCampaignManager';
import MusicSubmissionReviewer from '@/components/admin/MusicSubmissionReviewer';
import PaymentSystemManager from '@/components/admin/PaymentSystemManager';
import AdManager from '@/components/admin/AdManager';
import SystemSettings from '@/components/admin/SystemSettings';

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

  const { data: homepageSettings } = useQuery({
    queryKey: ['homepageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.HomepageSettings.list('-created_date', 1);
      return settings[0];
    },
    enabled: user?.role === 'admin'
  });

  const { data: featuredSongs = [] } = useQuery({
    queryKey: ['adminFeaturedSongs'],
    queryFn: () => base44.entities.FeaturedSong.list('position', 10),
    enabled: user?.role === 'admin'
  });

  const [themeData, setThemeData] = useState({
    theme_song_url: '',
    theme_song_title: '',
    theme_song_artist: '',
    autoplay: false,
    is_active: true
  });

  const [paypalLink, setPaypalLink] = useState('');

  const [editingFeaturedSong, setEditingFeaturedSong] = useState(null);
  const [featuredSongData, setFeaturedSongData] = useState({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => {
    if (homepageSettings) {
      setThemeData({
        theme_song_url: homepageSettings.theme_song_url || '',
        theme_song_title: homepageSettings.theme_song_title || '',
        theme_song_artist: homepageSettings.theme_song_artist || '',
        autoplay: homepageSettings.autoplay || false,
        is_active: homepageSettings.is_active !== false
      });
      setPaypalLink(homepageSettings.paypal_donation_link || '');
    }
  }, [homepageSettings]);

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

  const updateThemeSongMutation = useMutation({
    mutationFn: async (data) => {
      if (homepageSettings?.id) {
        return base44.entities.HomepageSettings.update(homepageSettings.id, data);
      } else {
        return base44.entities.HomepageSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageSettings'] });
    }
  });

  const updateFeaturedSongMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.FeaturedSong.update(id, data);
      } else {
        return base44.entities.FeaturedSong.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeaturedSongs'] });
      queryClient.invalidateQueries({ queryKey: ['featuredSongs'] });
      setEditingFeaturedSong(null);
      setFeaturedSongData({});
    }
  });

  const handleThumbnailUpload = async (e, position) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFeaturedSongData({ ...featuredSongData, thumbnail_url: file_url });
    } catch (error) {
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

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

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Featured Songs ({featuredSongs.length}/6)
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Auto Image Generator
            </TabsTrigger>
            <TabsTrigger value="popups" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Promotional Popups
            </TabsTrigger>
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Bible Chapters ({chapters.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Campaigns
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Music Submissions
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Payment System
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ad Manager
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Settings
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

          {/* Auto Image Generator Tab */}
          <TabsContent value="images">
            <AutoImageGenerator />
          </TabsContent>

          {/* Promotional Popups Tab */}
          <TabsContent value="popups">
            <PopupManager />
          </TabsContent>

          {/* Featured Songs Tab */}
          <TabsContent value="featured">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-stone-800 mb-2">Featured Song Buttons</h2>
              <p className="text-stone-600 mb-6">
                Manage 6 promotional song buttons displayed at the top center of the homepage.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((position) => {
                  const song = featuredSongs.find(s => s.position === position);
                  const isEditing = editingFeaturedSong === position;

                  return (
                    <div key={position} className="border border-stone-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-stone-800">
                          Slot {position}
                        </h3>
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingFeaturedSong(position);
                              setFeaturedSongData({
                                position,
                                youtube_link: song?.youtube_link || '',
                                song_title: song?.song_title || '',
                                artist_name: song?.artist_name || '',
                                thumbnail_url: song?.thumbnail_url || '',
                                is_active: song?.is_active !== false
                              });
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {song ? 'Edit' : 'Add'}
                          </Button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="YouTube URL *"
                            value={featuredSongData.youtube_link}
                            onChange={(e) => setFeaturedSongData({...featuredSongData, youtube_link: e.target.value})}
                          />
                          <Input
                            placeholder="Song Title *"
                            value={featuredSongData.song_title}
                            onChange={(e) => setFeaturedSongData({...featuredSongData, song_title: e.target.value})}
                          />
                          <Input
                            placeholder="Artist Name"
                            value={featuredSongData.artist_name}
                            onChange={(e) => setFeaturedSongData({...featuredSongData, artist_name: e.target.value})}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Thumbnail Image
                            </label>
                            {featuredSongData.thumbnail_url && (
                              <img 
                                src={featuredSongData.thumbnail_url} 
                                alt="Thumbnail preview" 
                                className="w-20 h-20 rounded-full object-cover mb-2"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              disabled={uploadingThumbnail}
                              className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                            />
                            {uploadingThumbnail && (
                              <p className="text-xs text-stone-500 mt-1">Uploading...</p>
                            )}
                          </div>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={featuredSongData.is_active}
                              onChange={(e) => setFeaturedSongData({...featuredSongData, is_active: e.target.checked})}
                              className="w-4 h-4 text-amber-600 rounded"
                            />
                            <span className="text-sm">Active</span>
                          </label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFeaturedSong(null);
                                setFeaturedSongData({});
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateFeaturedSongMutation.mutate({
                                id: song?.id,
                                data: featuredSongData
                              })}
                              disabled={!featuredSongData.youtube_link || !featuredSongData.song_title || uploadingThumbnail || updateFeaturedSongMutation.isPending}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {updateFeaturedSongMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : song ? (
                        <div className="text-sm">
                          {song.thumbnail_url && (
                            <img 
                              src={song.thumbnail_url} 
                              alt={song.song_title}
                              className="w-16 h-16 rounded-full object-cover mb-2"
                            />
                          )}
                          <p className="font-medium text-stone-800 mb-1">{song.song_title}</p>
                          {song.artist_name && (
                            <p className="text-stone-600 mb-1">{song.artist_name}</p>
                          )}
                          <a 
                            href={song.youtube_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <Link2 className="w-3 h-3" />
                            YouTube Link
                          </a>
                          {!song.is_active && (
                            <Badge className="mt-2 bg-stone-200 text-stone-600">Inactive</Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-stone-400 text-sm">Empty slot</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Email Campaigns Tab */}
          <TabsContent value="campaigns">
            <EmailCampaignManager />
          </TabsContent>

          {/* Music Submissions Tab */}
          <TabsContent value="music">
            <MusicSubmissionReviewer />
          </TabsContent>

          {/* Payment System Tab */}
          <TabsContent value="payments">
            <PaymentSystemManager />
          </TabsContent>

          {/* Ad Manager Tab */}
          <TabsContent value="ads">
            <AdManager />
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-stone-800 mb-2">Ministry Settings</h2>
              <p className="text-stone-600 mb-6">
                Configure donation and support settings for the ministry.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    PayPal Donation Link
                  </label>
                  <p className="text-xs text-stone-500 mb-3">
                    Enter your PayPal donation link. This will be used for all "Support Our Ministry" buttons throughout the site.
                  </p>
                  <Input
                    value={paypalLink}
                    onChange={(e) => setPaypalLink(e.target.value)}
                    placeholder="https://www.paypal.com/donate/?business=..."
                    className="mb-3"
                  />
                  <Button
                    onClick={() => updateThemeSongMutation.mutate({ paypal_donation_link: paypalLink })}
                    disabled={updateThemeSongMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {updateThemeSongMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save PayPal Link
                      </>
                    )}
                  </Button>
                  {homepageSettings?.paypal_donation_link && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        PayPal link is configured and active
                      </p>
                    </div>
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