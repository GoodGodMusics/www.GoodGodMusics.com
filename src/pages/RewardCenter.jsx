import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';

export default function RewardCenter() {
  const [user, setUser] = useState(null);
  const [customTheme, setCustomTheme] = useState('');
  const [customVerse, setCustomVerse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('User not authenticated');
      }
    };
    fetchUser();
  }, []);

  const { data: tokens = [] } = useQuery({
    queryKey: ['rewardTokens', user?.email],
    queryFn: () => base44.entities.RewardToken.filter({ user_email: user.email, is_redeemed: false }),
    enabled: !!user
  });

  const { data: memes = [] } = useQuery({
    queryKey: ['myMemes', user?.email],
    queryFn: async () => {
      const redeemedTokens = await base44.entities.RewardToken.filter({ 
        user_email: user.email, 
        is_redeemed: true 
      });
      const memeIds = redeemedTokens.map(t => t.redeemed_for_meme_id).filter(Boolean);
      if (memeIds.length === 0) return [];
      return base44.entities.ChristianMeme.list();
    },
    enabled: !!user
  });

  const updateTokenMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RewardToken.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewardTokens'] });
      queryClient.invalidateQueries({ queryKey: ['myMemes'] });
    }
  });

  const createMemeMutation = useMutation({
    mutationFn: (data) => base44.entities.ChristianMeme.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMemes'] });
    }
  });

  // Grok API helper
  const callGrokAPI = async (prompt) => {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Grok, an AI creating beautiful Christian inspirational content. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          model: 'grok-beta',
          temperature: 0.9
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Grok API Error:', error);
      // Fallback to Core.InvokeLLM
      return null;
    }
  };

  const generateMeme = async () => {
    if (tokens.length === 0) {
      alert('You need at least one reward token to generate a meme!');
      return;
    }

    if (!customTheme && !customVerse) {
      alert('Please provide either a theme or a Bible verse!');
      return;
    }

    setGenerating(true);

    try {
      const versePrompt = customVerse || 'a powerful Bible verse';
      const themePrompt = customTheme || 'faith and hope';

      // Try Grok first for enhanced content
      let llmResponse = await callGrokAPI(
        `Create an inspiring Christian meme about ${themePrompt}. ${customVerse ? `Feature this verse: ${customVerse}` : 'Include a relevant Bible verse.'}
        
Return JSON with:
- "caption": Uplifting 2-3 sentence message
- "verse_reference": Bible verse reference
- "image_prompt": Detailed prompt for generating a beautiful image (describe colors, mood, religious symbols, artistic style)`
      );

      // Fallback to Core.InvokeLLM if Grok fails
      if (!llmResponse) {
        llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a beautiful, inspiring caption for a Christian meme about ${themePrompt}. 
          ${customVerse ? `Include or reference this verse: ${customVerse}` : 'Include a relevant Bible verse.'} 
          The caption should be uplifting, faith-filled, and suitable for sharing.
          Keep it concise (2-3 sentences max).`,
          response_json_schema: {
            type: 'object',
            properties: {
              caption: { type: 'string' },
              verse_reference: { type: 'string' },
              image_prompt: { type: 'string' }
            }
          }
        });
      }

      const imagePrompt = llmResponse.image_prompt || `Beautiful Christian inspirational image with elegant typography. Theme: ${themePrompt}. 
        Style: Peaceful, uplifting, with soft lighting and calming colors (gold, white, blue, purple tones). 
        Include subtle religious symbols like a cross, dove, or light rays. 
        Professional quality, suitable for social media sharing. No text in the image.`;

      const imageResponse = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });

      const memeData = {
        image_url: imageResponse.url,
        caption: llmResponse.caption,
        theme: customTheme || themePrompt,
        bible_reference: customVerse || llmResponse.verse_reference
      };

      const newMeme = await createMemeMutation.mutateAsync(memeData);

      const token = tokens[0];
      await updateTokenMutation.mutateAsync({
        id: token.id,
        data: {
          is_redeemed: true,
          redeemed_for_meme_id: newMeme.id,
          redeemed_date: new Date().toISOString()
        }
      });

      setGeneratedMeme(newMeme);
      setCustomTheme('');
      setCustomVerse('');
    } catch (error) {
      alert('Failed to generate meme. Please try again.');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadMeme = async (meme) => {
    try {
      const response = await fetch(meme.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scripture-meme-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download meme');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-600 mb-4">Please log in to access the Reward Center.</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Gift className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">
              Reward Center
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-6">
              Redeem your reward tokens for beautiful scripture memes to share and inspire!
            </p>
            <Badge className="bg-amber-100 text-amber-800 text-xl px-6 py-3">
              <Gift className="w-5 h-5 mr-2" />
              {tokens.length} Tokens Available
            </Badge>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-600" />
                Generate Your Meme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Theme (Optional)
                </label>
                <Input
                  placeholder="e.g., Faith, Hope, Love, Perseverance..."
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Bible Verse (Optional)
                </label>
                <Textarea
                  placeholder="e.g., John 3:16, Philippians 4:13, or the full verse text..."
                  value={customVerse}
                  onChange={(e) => setCustomVerse(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Leave fields empty for a random inspirational meme, 
                  or customize with your favorite theme and verse!
                </p>
              </div>

              <Button
                onClick={generateMeme}
                disabled={tokens.length === 0 || generating}
                className="w-full bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Meme (1 Token)
                  </>
                )}
              </Button>

              {tokens.length === 0 && (
                <p className="text-sm text-center text-stone-600">
                  Earn tokens by scoring 100% on quizzes! 🏆
                </p>
              )}
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            {generatedMeme ? (
              <motion.div
                key="generated"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Your New Meme! 🎉</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={generatedMeme.image_url}
                      alt="Generated meme"
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="p-4 bg-stone-50 rounded-lg">
                      <p className="text-stone-700 italic mb-2">{generatedMeme.caption}</p>
                      {generatedMeme.bible_reference && (
                        <p className="text-sm text-amber-700 font-medium">
                          — {generatedMeme.bible_reference}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => downloadMeme(generatedMeme)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => setGeneratedMeme(null)}
                        variant="outline"
                        className="flex-1"
                      >
                        Generate Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <ImageIcon className="w-20 h-20 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-600">
                      Your generated meme will appear here
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {memes.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600">No memes yet. Generate your first one!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {memes.map((meme) => (
                  <motion.div
                    key={meme.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <img
                        src={meme.image_url}
                        alt={meme.caption}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <Button
                            onClick={() => downloadMeme(meme)}
                            size="sm"
                            className="w-full bg-white text-stone-800 hover:bg-stone-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-stone-600 line-clamp-2">
                      {meme.caption}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}