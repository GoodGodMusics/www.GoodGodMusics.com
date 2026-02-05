import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AutoImageGenerator() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0, skipped: 0 });
  const [isPaused, setIsPaused] = useState(false);

  const { data: releases = [] } = useQuery({
    queryKey: ['allReleases'],
    queryFn: () => base44.entities.MusicRelease.list('-created_date', 500)
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['allChapters'],
    queryFn: () => base44.entities.BibleChapter.list('chronological_order', 1500)
  });

  const releasesWithoutImages = releases.filter(r => !r.cover_image_url);
  const chaptersWithMusic = chapters.filter(c => c.youtube_link && c.song_title);

  const updateReleaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MusicRelease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReleases'] });
      queryClient.invalidateQueries({ queryKey: ['featuredReleases'] });
    }
  });

  const generateImageForRelease = async (release) => {
    try {
      const prompt = `Create a beautiful Christian worship music album cover for a song titled "${release.title}" by ${release.artist}. ${release.description || ''} Include religious Christian imagery, divine light, crosses, worship themes, peaceful scenes. Style: professional, spiritual, reverent, high quality`;
      
      const result = await base44.functions.secureGenerateImage({ prompt });
      
      await updateReleaseMutation.mutateAsync({
        id: release.id,
        data: { cover_image_url: result.url }
      });

      return { success: true, url: result.url };
    } catch (error) {
      console.error('Failed to generate image for', release.title, error);
      return { success: false, error: error.message };
    }
  };

  const handleBulkGenerate = async () => {
    setIsGenerating(true);
    setCurrentIndex(0);
    setResults({ success: 0, failed: 0, skipped: 0 });
    setIsPaused(false);

    for (let i = 0; i < releasesWithoutImages.length; i++) {
      if (isPaused) {
        setIsGenerating(false);
        return;
      }

      setCurrentIndex(i);
      const release = releasesWithoutImages[i];

      const result = await generateImageForRelease(release);
      
      if (result.success) {
        setResults(prev => ({ ...prev, success: prev.success + 1 }));
      } else {
        setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
      }

      // Wait 2 seconds between generations to avoid rate limiting
      if (i < releasesWithoutImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      handleBulkGenerate();
    }
  };

  const progress = releasesWithoutImages.length > 0 
    ? (currentIndex / releasesWithoutImages.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-stone-600">Total Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stone-800">{releases.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-stone-600">With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {releases.length - releasesWithoutImages.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-stone-600">Need Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {releasesWithoutImages.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-stone-600">Chapters w/ Music</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {chaptersWithMusic.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Automated Image Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-stone-600">
            Automatically generate AI cover images for all music releases that don't have one.
            Images are permanently saved to each release.
          </p>

          {releasesWithoutImages.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">All releases have cover images!</p>
                <p className="text-sm text-green-700">No automation needed at this time.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Button
                  onClick={isGenerating ? handlePauseResume : handleBulkGenerate}
                  disabled={releasesWithoutImages.length === 0}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  {isGenerating ? (
                    isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume Generation
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause ({currentIndex + 1}/{releasesWithoutImages.length})
                      </>
                    )
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Auto-Generation ({releasesWithoutImages.length} releases)
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="flex gap-4 text-sm">
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Success: {results.success}
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed: {results.failed}
                    </Badge>
                  </div>
                )}
              </div>

              {isGenerating && !isPaused && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span>Generating images...</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  {releasesWithoutImages[currentIndex] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Currently generating: {releasesWithoutImages[currentIndex].title}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        by {releasesWithoutImages[currentIndex].artist}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isPaused && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Generation paused at {currentIndex} of {releasesWithoutImages.length}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>AI generates unique Christian worship-themed cover images</li>
              <li>Images are automatically saved to each release permanently</li>
              <li>Process includes 2-second delays to avoid rate limiting</li>
              <li>Can be paused and resumed at any time</li>
              <li>Failed generations are tracked and can be retried</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Releases Without Images */}
      {releasesWithoutImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Releases Pending Image Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {releasesWithoutImages.slice(0, 20).map((release, index) => (
                <div 
                  key={release.id}
                  className={`p-3 rounded-lg border ${
                    isGenerating && index === currentIndex
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-800">{release.title}</p>
                      <p className="text-sm text-stone-600">{release.artist}</p>
                    </div>
                    {isGenerating && index === currentIndex && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    )}
                    {index < currentIndex && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
              {releasesWithoutImages.length > 20 && (
                <p className="text-sm text-stone-500 text-center py-2">
                  ... and {releasesWithoutImages.length - 20} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}