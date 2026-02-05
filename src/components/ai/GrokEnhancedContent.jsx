import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Loader2, Image as ImageIcon, RefreshCw, Heart } from 'lucide-react';

// Note: Grok API integration removed for security
// Using Core.InvokeLLM as the primary content generation method

export default function GrokEnhancedContent({ user }) {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const queryClient = useQueryClient();

  // Fetch user's recent activity
  const { data: recentQuizzes = [] } = useQuery({
    queryKey: ['recentQuizzes', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user
  });

  const { data: recentChapters = [] } = useQuery({
    queryKey: ['recentChapters', user?.email],
    queryFn: () => base44.entities.ChapterView.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', user?.email],
    queryFn: () => base44.entities.UserInteraction.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.ChristianMeme.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christianMemes'] });
    }
  });

  const generatePersonalizedContent = async () => {
    setGenerating(true);
    try {
      // Analyze user activity
      const quizTopics = recentQuizzes.map(q => q.book_name || q.category).filter(Boolean);
      const viewedBooks = recentChapters.map(c => c.book).filter(Boolean);
      const themes = [...new Set([...quizTopics, ...viewedBooks])].slice(0, 5);

      // Generate personalized motivational content using secure backend function
      const contentPrompt = `Based on a user's recent Bible study activity (topics: ${themes.join(', ')}), create an uplifting, personalized motivational message.`;

      const content = await base44.functions.secureInvokeLLM({
        prompt: contentPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            verse: { type: 'string' },
            verse_text: { type: 'string' },
            image_prompt: { type: 'string' },
            theme: { type: 'string' }
          }
        },
        use_grok: true
      });

      // Generate image using secure backend function
      const imageResponse = await base44.functions.secureGenerateImage({
        prompt: `${content.image_prompt}. Beautiful, professional quality, peaceful and uplifting Christian inspirational art. Cinematic lighting, soft colors (gold, white, blue, purple). Include subtle cross or light rays. No text in image.`
      });

      const memeData = {
        image_url: imageResponse.url,
        caption: `${content.message}\n\n"${content.verse_text}" - ${content.verse}`,
        theme: content.theme.toLowerCase(),
        bible_reference: content.verse
      };

      const newContent = await createContentMutation.mutateAsync(memeData);
      setGeneratedContent(newContent);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadContent = async (content) => {
    try {
      const response = await fetch(content.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holy-motivation-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download');
    }
  };

  if (!user) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl">AI-Powered Motivation</div>
            <div className="text-sm font-normal text-stone-600">Personalized content based on your journey</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-stone-700 mb-3">
            ✨ <strong>Grok AI</strong> analyzes your Bible study patterns and generates unique motivational content just for you!
          </p>
          <Button
            onClick={generatePersonalizedContent}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Your Personalized Content...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Personalized Motivation
              </>
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {generatedContent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={generatedContent.image_url}
                  alt="Motivational content"
                  className="w-full h-auto"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {generatedContent.theme}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 space-y-3">
                <p className="text-stone-800 leading-relaxed whitespace-pre-line">
                  {generatedContent.caption}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => downloadContent(generatedContent)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setGeneratedContent(null)}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/40 rounded-xl p-12 text-center"
            >
              <ImageIcon className="w-20 h-20 text-purple-300 mx-auto mb-4" />
              <p className="text-stone-600">
                Your personalized motivational content will appear here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}