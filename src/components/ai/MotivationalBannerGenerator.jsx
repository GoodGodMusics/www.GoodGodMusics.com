import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Image as ImageIcon, RefreshCw, Save, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MotivationalBannerGenerator({ user }) {
  const [generating, setGenerating] = useState(false);
  const [generatedBanner, setGeneratedBanner] = useState(null);
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const generateBanner = async () => {
    setGenerating(true);
    try {
      // Generate content using LLM
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a unique, family-friendly Christian motivational message. 
        
Return ONLY valid JSON with:
- "scripture": A Bible verse text (full verse)
- "scripture_reference": The verse reference (e.g., "John 3:16")
- "message": A short, uplifting 1-2 sentence message related to the verse
- "theme": One word theme (Faith, Hope, Love, Peace, Joy, Strength, Courage, Wisdom, Grace, Truth)
- "image_style": Choose ONE style: "beautiful serene nature", "vivid colorful abstract", "silly and joyful cartoon", "peaceful sunset/sunrise", "majestic mountains"
- "image_prompt": A detailed visual prompt for the chosen style (describe colors, mood, elements - NO TEXT in image)`,
        response_json_schema: {
          type: "object",
          properties: {
            scripture: { type: "string" },
            scripture_reference: { type: "string" },
            message: { type: "string" },
            theme: { type: "string" },
            image_style: { type: "string" },
            image_prompt: { type: "string" }
          }
        }
      });

      // Generate image
      const imageResponse = await base44.integrations.Core.GenerateImage({
        prompt: `${response.image_prompt}. Beautiful, professional quality, family-friendly inspirational art. ${response.image_style}. Soft lighting, harmonious colors. Peaceful and uplifting atmosphere. NO TEXT OR WORDS in the image.`
      });

      setGeneratedBanner({
        image_url: imageResponse.url,
        scripture: response.scripture,
        scripture_reference: response.scripture_reference,
        message: response.message,
        theme: response.theme,
        position: (user?.motivational_banners?.length || 0)
      });

    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate banner. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const saveBanner = async () => {
    if (!generatedBanner) return;
    
    const currentBanners = user?.motivational_banners || [];
    
    if (currentBanners.length >= 5) {
      alert('You can only save up to 5 banners. Delete one first.');
      return;
    }

    const newBanners = [...currentBanners, generatedBanner];
    
    await updateUserMutation.mutateAsync({
      motivational_banners: newBanners,
      active_banner_index: newBanners.length - 1
    });

    setGeneratedBanner(null);
  };

  const deleteBanner = async (index) => {
    const currentBanners = user?.motivational_banners || [];
    const newBanners = currentBanners.filter((_, i) => i !== index);
    
    await updateUserMutation.mutateAsync({
      motivational_banners: newBanners,
      active_banner_index: Math.max(0, Math.min(user?.active_banner_index || 0, newBanners.length - 1))
    });
  };

  const moveBanner = async (index, direction) => {
    const currentBanners = [...(user?.motivational_banners || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= currentBanners.length) return;
    
    [currentBanners[index], currentBanners[newIndex]] = [currentBanners[newIndex], currentBanners[index]];
    
    await updateUserMutation.mutateAsync({
      motivational_banners: currentBanners
    });
  };

  const setActiveBanner = async (index) => {
    await updateUserMutation.mutateAsync({
      active_banner_index: index
    });
  };

  const savedBanners = user?.motivational_banners || [];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl">AI Motivational Banner Generator</div>
              <div className="text-sm font-normal text-stone-600">Create unique inspirational images with scripture</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription>
              Generate family-friendly motivational images with Bible verses. Save up to 5 banners to display on your profile!
            </AlertDescription>
          </Alert>

          <Button
            onClick={generateBanner}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Your Unique Banner...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate New Banner
              </>
            )}
          </Button>

          <AnimatePresence mode="wait">
            {generatedBanner ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src={generatedBanner.image_url}
                    alt="Motivational banner"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {generatedBanner.theme}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <p className="font-serif text-lg mb-2">{generatedBanner.message}</p>
                    <p className="text-sm italic">"{generatedBanner.scripture}"</p>
                    <p className="text-xs mt-1 opacity-80">— {generatedBanner.scripture_reference}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={saveBanner}
                    disabled={savedBanners.length >= 5}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Banner ({savedBanners.length}/5)
                  </Button>
                  <Button
                    onClick={() => setGeneratedBanner(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Another
                  </Button>
                </div>
              </motion.div>
            ) : !generating && (
              <div className="bg-white/40 rounded-xl p-12 text-center">
                <ImageIcon className="w-20 h-20 text-purple-300 mx-auto mb-4" />
                <p className="text-stone-600">
                  Click generate to create your unique motivational banner
                </p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Saved Banners */}
      {savedBanners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Saved Banners ({savedBanners.length}/5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedBanners.map((banner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    (user?.active_banner_index || 0) === index
                      ? 'border-purple-500 shadow-lg'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={banner.image_url}
                      alt={`Banner ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-l-lg"
                    />
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline">{banner.theme}</Badge>
                          {(user?.active_banner_index || 0) === index && (
                            <Badge className="ml-2 bg-purple-600">Active</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveBanner(index, 'up')}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                          )}
                          {index < savedBanners.length - 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveBanner(index, 'down')}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteBanner(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-stone-700 mb-1">{banner.message}</p>
                      <p className="text-xs text-stone-600 italic">"{banner.scripture_reference}"</p>
                      {(user?.active_banner_index || 0) !== index && (
                        <Button
                          size="sm"
                          onClick={() => setActiveBanner(index)}
                          className="mt-2"
                          variant="outline"
                        >
                          Set as Active
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}