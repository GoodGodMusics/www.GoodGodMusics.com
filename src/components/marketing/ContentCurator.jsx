import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, TrendingUp, ThumbsUp, ThumbsDown, Share2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

export default function ContentCurator() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCurating, setIsCurating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [configForm, setConfigForm] = useState({
    config_name: '',
    prompt: '',
    keywords: '',
    categories: []
  });
  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ['curationConfigs'],
    queryFn: () => base44.entities.CurationConfig.list('-created_date', 50)
  });

  const { data: content = [] } = useQuery({
    queryKey: ['curatedContent'],
    queryFn: () => base44.entities.CuratedContent.list('-created_date', 100)
  });

  const createConfigMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.CurationConfig.create({
        ...data,
        user_email: user.email,
        keywords: data.keywords.split(',').map(k => k.trim())
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['curationConfigs']);
      setIsConfigOpen(false);
      setConfigForm({ config_name: '', prompt: '', keywords: '', categories: [] });
    }
  });

  const curateContentMutation = useMutation({
    mutationFn: async (configId) => {
      const config = configs.find(c => c.id === configId);
      if (!config) return;

      setIsCurating(true);
      
      // Use AI to curate content based on config
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content curator for a Christian music platform called Bible Harmony. 
        
Configuration: ${config.prompt}
Keywords: ${config.keywords?.join(', ')}

Search the internet for relevant content (articles, playlists, videos, trends, news) related to:
- Gospel music and Christian music trends
- Biblical themes in modern music
- Worship music and Psalms
- Christian ministry and outreach
- Inspirational content for faith-based audiences

For each piece of content found, provide:
1. Title
2. URL
3. Source name
4. Content type (article/playlist/video/podcast/trend/news)
5. A concise summary (2-3 sentences)
6. 3-5 relevant keywords
7. Related biblical themes
8. Relevance score (0-100)
9. Sentiment (uplifting/reflective/inspirational/educational)
10. Recommended action for using this content
11. Predicted viewership impact

Find 5-10 high-quality, recent pieces of content.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            curated_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" },
                  content_type: { type: "string" },
                  summary: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } },
                  biblical_themes: { type: "array", items: { type: "string" } },
                  relevance_score: { type: "number" },
                  sentiment: { type: "string" },
                  recommended_action: { type: "string" },
                  viewership_impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Store curated content
      const items = result.curated_items || [];
      for (const item of items) {
        await base44.entities.CuratedContent.create({
          ...item,
          category: config.categories?.[0] || 'gospel_music',
          status: 'new'
        });
      }

      // Update config last run
      await base44.entities.CurationConfig.update(configId, {
        last_run: new Date().toISOString()
      });

      queryClient.invalidateQueries(['curatedContent']);
      queryClient.invalidateQueries(['curationConfigs']);
      setIsCurating(false);
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ contentId, rating }) => 
      base44.entities.CuratedContent.update(contentId, { user_feedback: rating, status: 'reviewed' }),
    onSuccess: () => queryClient.invalidateQueries(['curatedContent'])
  });

  const filteredContent = content.filter(c => 
    filterCategory === 'all' || c.category === filterCategory
  );

  const sentimentColors = {
    uplifting: 'bg-green-100 text-green-800',
    reflective: 'bg-blue-100 text-blue-800',
    inspirational: 'bg-purple-100 text-purple-800',
    educational: 'bg-amber-100 text-amber-800',
    neutral: 'bg-stone-100 text-stone-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-600" />
            Harmony Curator AI
          </h2>
          <p className="text-stone-600">AI-powered content discovery and curation</p>
        </div>
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              New Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Curation Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Configuration Name"
                value={configForm.config_name}
                onChange={(e) => setConfigForm({...configForm, config_name: e.target.value})}
              />
              <Textarea
                placeholder="AI Curation Prompt (e.g., 'Find trending gospel music and worship songs with high engagement')"
                value={configForm.prompt}
                onChange={(e) => setConfigForm({...configForm, prompt: e.target.value})}
                rows={4}
              />
              <Input
                placeholder="Keywords (comma separated)"
                value={configForm.keywords}
                onChange={(e) => setConfigForm({...configForm, keywords: e.target.value})}
              />
              <Button
                onClick={() => createConfigMutation.mutate(configForm)}
                disabled={!configForm.config_name || !configForm.prompt || createConfigMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Create Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Curation Configs */}
      <Card>
        <CardHeader>
          <CardTitle>Active Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {configs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{config.config_name}</h3>
                  <p className="text-sm text-stone-600 mt-1">{config.prompt}</p>
                  {config.last_run && (
                    <p className="text-xs text-stone-500 mt-1">
                      Last run: {new Date(config.last_run).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => curateContentMutation.mutate(config.id)}
                  disabled={isCurating}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isCurating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Curate Now
                    </>
                  )}
                </Button>
              </div>
            ))}
            {configs.length === 0 && (
              <p className="text-stone-500 text-center py-4">No configurations yet. Create one to start curating!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="gospel_music">Gospel Music</SelectItem>
          <SelectItem value="worship">Worship</SelectItem>
          <SelectItem value="biblical_interpretation">Biblical Interpretation</SelectItem>
          <SelectItem value="christian_news">Christian News</SelectItem>
          <SelectItem value="ministry">Ministry</SelectItem>
        </SelectContent>
      </Select>

      {/* Curated Content */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredContent.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <Badge className={sentimentColors[item.sentiment] || sentimentColors.neutral}>
                  {item.sentiment}
                </Badge>
              </div>
              <p className="text-xs text-stone-500">{item.source}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-700 mb-3">{item.summary}</p>
              
              {item.keywords && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.keywords.slice(0, 5).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              )}

              {item.relevance_score && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-600">Relevance</span>
                    <span className="font-semibold">{item.relevance_score}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.relevance_score}%` }}
                    />
                  </div>
                </div>
              )}

              {item.viewership_impact && (
                <div className="bg-amber-50 p-2 rounded text-sm mb-3">
                  <TrendingUp className="w-4 h-4 inline mr-1 text-amber-600" />
                  <span className="text-amber-800">{item.viewership_impact}</span>
                </div>
              )}

              {item.recommended_action && (
                <p className="text-sm text-stone-600 mb-3 italic">{item.recommended_action}</p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(item.url, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant={item.user_feedback === 5 ? 'default' : 'outline'}
                  onClick={() => feedbackMutation.mutate({ contentId: item.id, rating: 5 })}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={item.user_feedback === 1 ? 'default' : 'outline'}
                  onClick={() => feedbackMutation.mutate({ contentId: item.id, rating: 1 })}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No curated content yet. Create a configuration and start curating!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}