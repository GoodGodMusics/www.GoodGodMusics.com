import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, Music, Clock, CheckCircle, Loader2, Upload, ExternalLink } from 'lucide-react';

export default function CustomSongRequestManager() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['customSongRequests'],
    queryFn: () => base44.entities.CustomSongRequest.list('request_number', 500)
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomSongRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customSongRequests']);
      setSelectedRequest(null);
    }
  });

  const uploadSongMutation = useMutation({
    mutationFn: async ({ id, file }) => {
      const { file_url } = await base44.functions.secureUploadFile({ file });
      const folderNumber = Math.floor((requests.filter(r => r.status === 'completed').length) / 300) + 1;
      const folderName = folderNumber === 1 ? 'Custom Songs for customers' : `Custom Songs for customers ${folderNumber}`;
      
      return base44.entities.CustomSongRequest.update(id, {
        song_file_url: file_url,
        folder_name: folderName,
        status: 'completed',
        completed_date: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['customSongRequests'])
  });

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    total: requests.length
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    delivered: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            Custom Song Requests
          </h2>
          <p className="text-stone-600">Manage personalized song requests (First-Come-First-Serve)</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-stone-800">{stats.pending}</div>
              <div className="text-sm text-stone-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-stone-800">{stats.in_progress}</div>
              <div className="text-sm text-stone-600">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-stone-800">{stats.completed}</div>
              <div className="text-sm text-stone-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Music className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-stone-800">{stats.total}</div>
              <div className="text-sm text-stone-600">Total Requests</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Requests Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRequest(request)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">#{request.request_number}</Badge>
                    <Badge className={statusColors[request.status]}>{request.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{request.recipient_name}</CardTitle>
                  <p className="text-sm text-stone-500 capitalize">{request.recipient_type?.replace('_', ' ')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-stone-500">Requested by:</span>
                  <p className="font-medium">{request.requester_name}</p>
                </div>
                {request.scripture_chapter && (
                  <div>
                    <span className="text-stone-500">Scripture:</span>
                    <p className="font-medium">{request.scripture_chapter}</p>
                  </div>
                )}
                <div>
                  <span className="text-stone-500">Style:</span>
                  <Badge variant="outline" className="ml-2 capitalize">{request.song_style}</Badge>
                </div>
                {request.can_record_reaction && (
                  <Badge className="bg-pink-100 text-pink-800">
                    <Heart className="w-3 h-3 mr-1" />
                    Reaction Recording OK
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-stone-500">
            No requests found in this category.
          </CardContent>
        </Card>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Request #{selectedRequest.request_number}: {selectedRequest.recipient_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status Update */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(status) => 
                      updateRequestMutation.mutate({ 
                        id: selectedRequest.id, 
                        data: { status } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Folder</label>
                  <Input value={selectedRequest.folder_name || 'Not assigned'} disabled />
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500">Requester:</span>
                  <p className="font-medium">{selectedRequest.requester_name}</p>
                  <p className="text-stone-500">{selectedRequest.requester_email}</p>
                </div>
                <div>
                  <span className="text-stone-500">Recipient Type:</span>
                  <p className="font-medium capitalize">{selectedRequest.recipient_type?.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Personal Details</label>
                <div className="bg-stone-50 p-4 rounded text-sm">{selectedRequest.personal_details}</div>
              </div>

              {selectedRequest.favorite_things && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Favorite Things</label>
                  <div className="bg-stone-50 p-4 rounded text-sm">{selectedRequest.favorite_things}</div>
                </div>
              )}

              {selectedRequest.scripture_chapter && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Scripture Reference</label>
                  <Badge variant="outline">{selectedRequest.scripture_chapter}</Badge>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes..."
                  value={selectedRequest.admin_notes || ''}
                  onChange={(e) => 
                    updateRequestMutation.mutate({ 
                      id: selectedRequest.id, 
                      data: { admin_notes: e.target.value } 
                    })
                  }
                  rows={3}
                />
              </div>

              {/* Upload Song */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Completed Song</label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      uploadSongMutation.mutate({ id: selectedRequest.id, file });
                    }
                  }}
                />
                {selectedRequest.song_file_url && (
                  <a 
                    href={selectedRequest.song_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Uploaded Song
                  </a>
                )}
              </div>

              {selectedRequest.can_record_reaction && (
                <div className="bg-pink-50 p-4 rounded">
                  <div className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Reaction Recording Approved</p>
                      <p className="text-sm text-stone-600 mt-1">
                        Contact: {selectedRequest.contact_for_reaction || selectedRequest.requester_email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}