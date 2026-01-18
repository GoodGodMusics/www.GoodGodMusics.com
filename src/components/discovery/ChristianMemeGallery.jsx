import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Download, RefreshCw, Loader2, Heart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ChristianMemeGallery() {
  const [generatingNew, setGeneratingNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: memes = [], isLoading } = useQuery({
    queryKey: ['christianMemes'],
    queryFn: () => base44.entities.ChristianMeme.list('-created_date', 20)
  });

  const generateMemeMutation = useMutation({
    mutationFn: async () => {
      const themes = ['faith', 'prayer', 'grace', 'love', 'hope', 'worship', 'joy', 'peace'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a wholesome Christian meme concept about ${randomTheme}. The meme should be uplifting, funny, and relatable to modern Christian life. Provide a caption and a brief image description.`,
        response_json_schema: {
          type: "object",
          properties: {
            caption: { type: "string" },
            image_description: { type: "string" },
            bible_reference: { type: "string" }
          }
        }
      });

      // Generate the meme image
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: `Christian meme style image: ${result.image_description}. Wholesome, clean, family-friendly, text overlay ready. Style: modern meme format, clear composition.`
      });

      // Save to database
      await base44.entities.ChristianMeme.create({
        image_url: imageResult.url,
        caption: result.caption,
        theme: randomTheme,
        bible_reference: result.bible_reference
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christianMemes'] });
      setGeneratingNew(false);
    },
    onError: () => {
      alert('Failed to generate meme. Please try again.');
      setGeneratingNew(false);
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ meme, memeUrl }) => {
      // Track download
      await base44.entities.ChristianMeme.update(meme.id, {
        downloads_count: (meme.downloads_count || 0) + 1
      });

      // Download image
      const response = await fetch(memeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `christian-meme-${meme.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christianMemes'] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: (meme) => 
      base44.entities.ChristianMeme.update(meme.id, {
        likes_count: (meme.likes_count || 0) + 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christianMemes'] });
    }
  });

  const handleGenerateNew = () => {
    setGeneratingNew(true);
    generateMemeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Smile className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-stone-800">Christian Memes</h3>
            <p className="text-sm text-stone-600">AI-generated wholesome Christian humor</p>
          </div>
        </div>
        <Button
          onClick={handleGenerateNew}
          disabled={generatingNew}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          {generatingNew ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New Meme
            </>
          )}
        </Button>
      </div>

      {/* Memes Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Loading memes...</p>
        </div>
      ) : memes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Smile className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800 mb-2">No Memes Yet</h3>
            <p className="text-stone-600 mb-6">Generate your first Christian meme!</p>
            <Button onClick={handleGenerateNew} className="bg-yellow-500 hover:bg-yellow-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Meme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {memes.map((meme) => (
              <motion.div
                key={meme.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img
                      src={meme.image_url}
                      alt={meme.caption}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        {meme.theme}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <p className="font-medium text-stone-800 line-clamp-2">{meme.caption}</p>
                    {meme.bible_reference && (
                      <p className="text-xs text-purple-600 italic">— {meme.bible_reference}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-stone-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {meme.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {meme.downloads_count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => likeMutation.mutate(meme)}
                        className="flex-1"
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Like
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadMutation.mutate({ meme, memeUrl: meme.image_url })}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}