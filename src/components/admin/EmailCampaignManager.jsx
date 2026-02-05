import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Calendar, Edit, Trash2, Send, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function EmailCampaignManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    campaign_name: '',
    subject: '',
    body: '',
    link_url: '',
    link_text: '',
    image_url: '',
    scheduled_date: '',
    target_audience: 'all_users',
    status: 'draft'
  });

  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['emailCampaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Campaign created successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      setIsModalOpen(false);
      setEditingCampaign(null);
      resetForm();
      toast.success('Campaign updated successfully!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      toast.success('Campaign deleted');
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      // Get all users
      const users = await base44.entities.User.list();
      let recipients = users;

      if (campaign.target_audience === 'active_users') {
        const interactions = await base44.entities.UserInteraction.list('-created_date', 1000);
        const activeEmails = new Set(interactions.map(i => i.user_email));
        recipients = users.filter(u => activeEmails.has(u.email));
      }

      // Send emails using secure backend function
      const emailPromises = recipients.map(user => 
        base44.functions.secureSendEmail({
          to: user.email,
          subject: campaign.subject,
          body: `
            ${campaign.image_url ? `<img src="${campaign.image_url}" style="max-width: 600px; width: 100%;" />` : ''}
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              ${campaign.body.replace(/\n/g, '<br>')}
              ${campaign.link_url ? `
                <div style="margin-top: 20px;">
                  <a href="${campaign.link_url}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    ${campaign.link_text || 'Learn More'}
                  </a>
                </div>
              ` : ''}
            </div>
          `
        })
      );

      await Promise.all(emailPromises);

      // Update campaign status
      await base44.entities.EmailCampaign.update(campaign.id, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        recipients_count: recipients.length
      });

      return recipients.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      toast.success(`Campaign sent to ${count} recipients!`);
    }
  });

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      subject: '',
      body: '',
      link_url: '',
      link_text: '',
      image_url: '',
      scheduled_date: '',
      target_audience: 'all_users',
      status: 'draft'
    });
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaign_name: campaign.campaign_name,
      subject: campaign.subject,
      body: campaign.body,
      link_url: campaign.link_url || '',
      link_text: campaign.link_text || '',
      image_url: campaign.image_url || '',
      scheduled_date: campaign.scheduled_date?.split('T')[0] || '',
      target_audience: campaign.target_audience,
      status: campaign.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
    };

    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    toast.loading('Uploading image...');
    try {
      const result = await base44.functions.secureUploadFile({ file });
      setFormData({ ...formData, image_url: result.file_url });
      toast.dismiss();
      toast.success('Image uploaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to upload image');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-stone-200 text-stone-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-200 text-stone-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" />
            Email Campaign Manager
          </CardTitle>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No email campaigns yet. Create your first one!</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-stone-200 rounded-lg hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-stone-800">{campaign.campaign_name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-600 mb-1">
                      <strong>Subject:</strong> {campaign.subject}
                    </p>
                    <p className="text-sm text-stone-500 mb-2 line-clamp-2">
                      {campaign.body}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {campaign.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(campaign.scheduled_date).toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.target_audience.replace('_', ' ')}
                      </span>
                      {campaign.recipients_count && (
                        <span>Sent to {campaign.recipients_count} users</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendCampaignMutation.mutate(campaign)}
                        disabled={sendCampaignMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Delete this campaign?')) {
                          deleteMutation.mutate(campaign.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit Campaign' : 'Create Email Campaign'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  required
                  placeholder="New Album Release"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Subject Line</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="New Music Just Dropped!"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Body</label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  placeholder="Write your email message here..."
                  rows={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Promotional Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {formData.image_url && (
                  <img src={formData.image_url} className="mt-2 w-full max-w-sm rounded-lg" alt="Preview" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Link URL</label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Button Text</label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="Listen Now"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select value={formData.target_audience} onValueChange={(val) => setFormData({ ...formData, target_audience: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="active_users">Active Users</SelectItem>
                      <SelectItem value="subscribers">Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCampaign(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}