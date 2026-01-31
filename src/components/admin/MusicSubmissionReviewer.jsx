import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, Check, X, Eye, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function MusicSubmissionReviewer() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  const { data: submissions = [] } = useQuery({
    queryKey: ['musicSubmissions'],
    queryFn: () => base44.entities.MusicSubmission.list('submission_number')
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.MusicSubmission.update(id, {
        status,
        admin_notes: notes,
        reviewed_by: currentUser?.email,
        reviewed_date: new Date().toISOString()
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['musicSubmissions'] });
      setIsModalOpen(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      toast.success(variables.status === 'approved' ? 'Submission approved!' : 'Submission rejected');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MusicSubmission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicSubmissions'] });
      toast.success('Submission deleted');
    }
  });

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setIsModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({
      id: selectedSubmission.id,
      status: 'approved',
      notes: adminNotes
    });
  };

  const handleReject = () => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({
      id: selectedSubmission.id,
      status: 'rejected',
      notes: adminNotes
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-200 text-stone-800';
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'under_review');
  const reviewedSubmissions = submissions.filter(s => s.status === 'approved' || s.status === 'rejected');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-amber-600" />
          Music Submission Review Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({reviewedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <Music2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending submissions</p>
                <p className="text-sm mt-1">Artists can submit music via GoodGodMusics@gmail.com</p>
              </div>
            ) : (
              pendingSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-amber-200 bg-amber-50/30 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                          #{submission.submission_number || index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800">{submission.song_title}</h3>
                          <p className="text-sm text-stone-600">by {submission.artist_name}</p>
                        </div>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-stone-600">
                        <p><strong>Type:</strong> {submission.submission_type.replace('_', ' ')}</p>
                        <p><strong>From:</strong> {submission.submitter_email}</p>
                        {submission.description && (
                          <p className="line-clamp-2"><strong>Description:</strong> {submission.description}</p>
                        )}
                        {submission.biblical_themes && submission.biblical_themes.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {submission.biblical_themes.map((theme, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <a
                          href={submission.youtube_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          YouTube
                        </a>
                        {submission.spotify_link && (
                          <a
                            href={submission.spotify_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Spotify
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(submission)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this submission?')) {
                            deleteMutation.mutate(submission.id);
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedSubmissions.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No reviewed submissions yet</p>
              </div>
            ) : (
              reviewedSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-stone-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-stone-800">{submission.song_title}</h3>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-1">by {submission.artist_name}</p>
                      {submission.admin_notes && (
                        <p className="text-sm text-stone-500 italic">
                          Admin notes: {submission.admin_notes}
                        </p>
                      )}
                      {submission.reviewed_by && (
                        <p className="text-xs text-stone-400 mt-2">
                          Reviewed by {submission.reviewed_by} on{' '}
                          {new Date(submission.reviewed_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(submission)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Submission</DialogTitle>
            </DialogHeader>

            {selectedSubmission && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-stone-800 mb-1">
                    {selectedSubmission.song_title}
                  </h3>
                  <p className="text-stone-600">by {selectedSubmission.artist_name}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Submission Type:</strong> {selectedSubmission.submission_type.replace('_', ' ')}</p>
                  <p><strong>Submitter:</strong> {selectedSubmission.submitter_email}</p>
                  {selectedSubmission.description && (
                    <div>
                      <strong>Description:</strong>
                      <p className="text-stone-600 mt-1">{selectedSubmission.description}</p>
                    </div>
                  )}
                  {selectedSubmission.biblical_themes && selectedSubmission.biblical_themes.length > 0 && (
                    <div>
                      <strong>Biblical Themes:</strong>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {selectedSubmission.biblical_themes.map((theme, i) => (
                          <Badge key={i} variant="outline">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSubmission.suggested_chapters && selectedSubmission.suggested_chapters.length > 0 && (
                    <div>
                      <strong>Suggested Chapters:</strong>
                      <p className="text-stone-600 mt-1">
                        {selectedSubmission.suggested_chapters.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <a
                    href={selectedSubmission.youtube_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Play className="w-4 h-4" />
                    Watch on YouTube
                  </a>
                  {selectedSubmission.spotify_link && (
                    <a
                      href={selectedSubmission.spotify_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      Listen on Spotify
                    </a>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedSubmission(null);
                      setAdminNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}