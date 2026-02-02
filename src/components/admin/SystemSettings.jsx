import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Globe, Key, Sliders, Mail, BarChart3, Save, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({});

  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSettings.list('-created_date'),
    onSuccess: (data) => {
      const settingsMap = {};
      data.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsMap);
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category, description }) => {
      const existing = allSettings.find(s => s.setting_key === key);
      const user = await base44.auth.me();
      
      if (existing) {
        return base44.entities.SystemSettings.update(existing.id, {
          setting_value: value,
          last_updated_by: user.email
        });
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: key,
          setting_value: value,
          category,
          description,
          last_updated_by: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('Settings updated');
    }
  });

  const handleSave = (category) => {
    const categorySettings = {
      domain: [
        { key: 'primary_domain', value: settings.primary_domain || '', category: 'domain', description: 'Primary website domain' },
        { key: 'cdn_url', value: settings.cdn_url || '', category: 'domain', description: 'CDN URL for assets' }
      ],
      api: [
        { key: 'spotify_client_id', value: settings.spotify_client_id || '', category: 'api', description: 'Spotify API Client ID' },
        { key: 'youtube_api_key', value: settings.youtube_api_key || '', category: 'api', description: 'YouTube Data API Key' }
      ],
      features: [
        { key: 'campaigns_enabled', value: settings.campaigns_enabled || 'true', category: 'features', description: 'Enable music campaigns' },
        { key: 'analytics_enabled', value: settings.analytics_enabled || 'true', category: 'features', description: 'Enable analytics tracking' }
      ],
      limits: [
        { key: 'max_uploads_per_user', value: settings.max_uploads_per_user || '50', category: 'limits', description: 'Max music uploads per user' },
        { key: 'api_rate_limit', value: settings.api_rate_limit || '1000', category: 'limits', description: 'API calls per hour' }
      ]
    };

    categorySettings[category]?.forEach(setting => {
      updateSettingMutation.mutate(setting);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Settings</h2>
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>

      <Tabs defaultValue="domain">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="domain">
            <Globe className="w-4 h-4 mr-2" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="features">
            <Sliders className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="limits">
            <BarChart3 className="w-4 h-4 mr-2" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Domain Settings */}
        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Domain</Label>
                <Input
                  value={settings.primary_domain || ''}
                  onChange={(e) => setSettings({...settings, primary_domain: e.target.value})}
                  placeholder="www.GoodGodMusics.com"
                />
                <p className="text-xs text-stone-500 mt-1">Main website URL</p>
              </div>

              <div>
                <Label>CDN URL (Optional)</Label>
                <Input
                  value={settings.cdn_url || ''}
                  onChange={(e) => setSettings({...settings, cdn_url: e.target.value})}
                  placeholder="https://cdn.goodgodmusics.com"
                />
                <p className="text-xs text-stone-500 mt-1">For serving static assets</p>
              </div>

              <Button onClick={() => handleSave('domain')} className="bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4 mr-2" />
                Save Domain Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Integration Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Spotify Client ID</Label>
                <Input
                  type="password"
                  value={settings.spotify_client_id || ''}
                  onChange={(e) => setSettings({...settings, spotify_client_id: e.target.value})}
                  placeholder="Enter Spotify Client ID"
                />
              </div>

              <div>
                <Label>YouTube API Key</Label>
                <Input
                  type="password"
                  value={settings.youtube_api_key || ''}
                  onChange={(e) => setSettings({...settings, youtube_api_key: e.target.value})}
                  placeholder="Enter YouTube Data API Key"
                />
              </div>

              <Button onClick={() => handleSave('api')} className="bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4 mr-2" />
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-semibold">Music Campaigns</p>
                  <p className="text-sm text-stone-600">Enable campaign management system</p>
                </div>
                <Switch
                  checked={settings.campaigns_enabled === 'true'}
                  onCheckedChange={(checked) => setSettings({...settings, campaigns_enabled: checked.toString()})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-semibold">Analytics Tracking</p>
                  <p className="text-sm text-stone-600">Track API usage and performance</p>
                </div>
                <Switch
                  checked={settings.analytics_enabled === 'true'}
                  onCheckedChange={(checked) => setSettings({...settings, analytics_enabled: checked.toString()})}
                />
              </div>

              <Button onClick={() => handleSave('features')} className="bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4 mr-2" />
                Save Features
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Max Uploads Per User</Label>
                <Input
                  type="number"
                  value={settings.max_uploads_per_user || '50'}
                  onChange={(e) => setSettings({...settings, max_uploads_per_user: e.target.value})}
                />
              </div>

              <div>
                <Label>API Rate Limit (calls/hour)</Label>
                <Input
                  type="number"
                  value={settings.api_rate_limit || '1000'}
                  onChange={(e) => setSettings({...settings, api_rate_limit: e.target.value})}
                />
              </div>

              <Button onClick={() => handleSave('limits')} className="bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4 mr-2" />
                Save Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>From Email</Label>
                <Input
                  value={settings.email_from || 'GoodGodMusics@gmail.com'}
                  onChange={(e) => setSettings({...settings, email_from: e.target.value})}
                />
              </div>

              <div>
                <Label>Support Email</Label>
                <Input
                  value={settings.email_support || 'GoodGodMusics@gmail.com'}
                  onChange={(e) => setSettings({...settings, email_support: e.target.value})}
                />
              </div>

              <Button onClick={() => handleSave('email')} className="bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}