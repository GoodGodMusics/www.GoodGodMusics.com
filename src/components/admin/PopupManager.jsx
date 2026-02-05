import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, Sparkles, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PopupManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['promotionalPopups'],
    queryFn: () => base44.entities.PromotionalPopup.list('-priority', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PromotionalPopup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionalPopups'] });
      setShowCreateModal(false);
      setEditingPopup(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PromotionalPopup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionalPopups'] });
      setEditingPopup(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromotionalPopup.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotionalPopups'] })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      announcement_text: formData.get('announcement_text'),
      description: formData.get('description'),
      popup_type: formData.get('popup_type'),
      image_url: formData.get('image_url'),
      youtube_link: formData.get('youtube_link'),
      spotify_link: formData.get('spotify_link'),
      custom_link_1_label: formData.get('custom_link_1_label'),
      custom_link_1_url: formData.get('custom_link_1_url'),
      custom_link_2_label: formData.get('custom_link_2_label'),
      custom_link_2_url: formData.get('custom_link_2_url'),
      show_frequency: formData.get('show_frequency'),
      start_date: formData.get('start_date') || null,
      end_date: formData.get('end_date') || null,
      is_active: formData.get('is_active') === 'on',
      priority: parseInt(formData.get('priority')) || 0,
      delay_seconds: parseFloat(formData.get('delay_seconds')) || 0.5,
      min_close_time: parseInt(formData.get('min_close_time')) || 3
    };

    if (editingPopup) {
      updateMutation.mutate({ id: editingPopup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async (e, popupId = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.functions.secureUploadFile({ file });
      
      if (popupId) {
        updateMutation.mutate({ 
          id: popupId, 
          data: { image_url: file_url } 
        });
      } else {
        document.getElementById('image_url').value = file_url;
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = (popup) => {
    updateMutation.mutate({
      id: popup.id,
      data: { is_active: !popup.is_active }
    });
  };

  const isPopupCurrentlyActive = (popup) => {
    if (!popup.is_active) return false;
    
    const now = new Date();
    if (popup.start_date && new Date(popup.start_date) > now) return false;
    if (popup.end_date && new Date(popup.end_date) < now) return false;
    
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Promotional Popups</h2>
          <p className="text-stone-600 text-sm mt-1">Manage album releases and marketing promotions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Popup
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40 bg-stone-100" />
            </Card>
          ))}
        </div>
      ) : popups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800 mb-2">No Popups Created</h3>
            <p className="text-stone-600 mb-6">Create your first promotional popup</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              Create First Popup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {popups.map((popup) => (
            <motion.div key={popup.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={isPopupCurrentlyActive(popup) ? 'ring-2 ring-green-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {popup.image_url ? (
                      <img src={popup.image_url} alt={popup.title} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-stone-800 truncate">{popup.title}</h3>
                        {isPopupCurrentlyActive(popup) && (
                          <Badge className="bg-green-600">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 mb-2">{popup.subtitle}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {popup.popup_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {popup.show_frequency.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority: {popup.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-stone-200">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(popup)}
                      className={popup.is_active ? 'text-green-600' : 'text-stone-600'}
                    >
                      {popup.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPopup(popup)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Delete this popup?')) {
                          deleteMutation.mutate(popup.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingPopup} onOpenChange={() => {
        setShowCreateModal(false);
        setEditingPopup(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPopup ? 'Edit Popup' : 'Create New Popup'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Basic Information</h3>
              
              <div>
                <Label>Title *</Label>
                <Input name="title" defaultValue={editingPopup?.title} required placeholder="Kings and Judges" />
              </div>

              <div>
                <Label>Subtitle</Label>
                <Input name="subtitle" defaultValue={editingPopup?.subtitle} placeholder="GoodGodMusics" />
              </div>

              <div>
                <Label>Announcement Text</Label>
                <Input name="announcement_text" defaultValue={editingPopup?.announcement_text} placeholder="Coming February 7th, 2026" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingPopup?.description} placeholder="Additional details..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Popup Type *</Label>
                  <Select name="popup_type" defaultValue={editingPopup?.popup_type || 'album_release'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="album_release">Album Release</SelectItem>
                      <SelectItem value="event_promotion">Event Promotion</SelectItem>
                      <SelectItem value="store_sale">Store Sale</SelectItem>
                      <SelectItem value="ministry_announcement">Ministry Announcement</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Show Frequency *</Label>
                  <Select name="show_frequency" defaultValue={editingPopup?.show_frequency || 'once_per_day'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_per_day">Once Per Day</SelectItem>
                      <SelectItem value="once_per_session">Once Per Session</SelectItem>
                      <SelectItem value="once_ever">Once Ever</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Image</h3>
              
              <div>
                <Label>Image URL</Label>
                <Input id="image_url" name="image_url" defaultValue={editingPopup?.image_url} placeholder="https://..." />
              </div>

              <div>
                <Label>Or Upload Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} disabled={uploading} />
                {uploading && <p className="text-sm text-stone-600 mt-1">Uploading...</p>}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Links</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>YouTube Link</Label>
                  <Input name="youtube_link" defaultValue={editingPopup?.youtube_link} placeholder="https://youtube.com/..." />
                </div>

                <div>
                  <Label>Spotify Link</Label>
                  <Input name="spotify_link" defaultValue={editingPopup?.spotify_link} placeholder="https://open.spotify.com/..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Custom Button 1 Label</Label>
                  <Input name="custom_link_1_label" defaultValue={editingPopup?.custom_link_1_label} placeholder="Learn More" />
                </div>

                <div>
                  <Label>Custom Button 1 URL</Label>
                  <Input name="custom_link_1_url" defaultValue={editingPopup?.custom_link_1_url} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Custom Button 2 Label</Label>
                  <Input name="custom_link_2_label" defaultValue={editingPopup?.custom_link_2_label} placeholder="Shop Now" />
                </div>

                <div>
                  <Label>Custom Button 2 URL</Label>
                  <Input name="custom_link_2_url" defaultValue={editingPopup?.custom_link_2_url} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Schedule & Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Schedule & Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" name="start_date" defaultValue={editingPopup?.start_date} />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input type="date" name="end_date" defaultValue={editingPopup?.end_date} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Priority (0-100)</Label>
                  <Input type="number" name="priority" defaultValue={editingPopup?.priority || 0} min="0" max="100" />
                </div>

                <div>
                  <Label>Delay (seconds)</Label>
                  <Input type="number" step="0.1" name="delay_seconds" defaultValue={editingPopup?.delay_seconds || 0.5} />
                </div>

                <div>
                  <Label>Min Close Time (sec)</Label>
                  <Input type="number" name="min_close_time" defaultValue={editingPopup?.min_close_time || 3} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch name="is_active" defaultChecked={editingPopup?.is_active || false} />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateModal(false);
                setEditingPopup(null);
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingPopup ? 'Update Popup' : 'Create Popup'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}