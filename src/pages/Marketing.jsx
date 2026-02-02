import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Music, Target, Send, Users } from 'lucide-react';
import CampaignManager from '@/components/music-promotion/CampaignManager';
import UsageAnalytics from '@/components/analytics/UsageAnalytics';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function Marketing() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-stone-800 mb-2">
            Marketing Hub
          </h1>
          <p className="text-stone-600">
            Manage campaigns, track performance, and optimize your reach
          </p>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="mb-6">
            <TabsTrigger value="campaigns">
              <Music className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <CampaignManager userEmail={user.email} />
          </TabsContent>

          <TabsContent value="analytics">
            <UsageAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}