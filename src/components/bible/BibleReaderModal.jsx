import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2, BookOpen, Settings, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function BibleReaderModal({ isOpen, onClose, chapter, eraChapters = [] }) {
  const [bibleText, setBibleText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voiceGender, setVoiceGender] = useState('female');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);

  // Get user preferences from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem('bible_speech_rate');
    const savedGender = localStorage.getItem('bible_voice_gender');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
    if (savedGender) setVoiceGender(savedGender);
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('bible_speech_rate', speechRate.toString());
    localStorage.setItem('bible_voice_gender', voiceGender);
  }, [speechRate, voiceGender]);

  // Find current chapter in era chapters
  useEffect(() => {
    if (chapter && eraChapters.length > 0) {
      const index = eraChapters.findIndex(c => c.id === chapter.id);
      if (index !== -1) {
        setCurrentChapterIndex(index);
      }
    }
  }, [chapter, eraChapters]);

  const currentChapter = eraChapters[currentChapterIndex] || chapter;

  // Fetch Bible text using AI
  const fetchBibleText = async (book, chapterNum) => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Please provide the full text of ${book} chapter ${chapterNum} from the NIV (New International Version) Bible. 
        
Format the response as follows:
- Start with the chapter heading: "${book} ${chapterNum}"
- Then provide all verses in this exact format: "1 [verse text]" for verse 1, "2 [verse text]" for verse 2, etc.
- Each verse should be on its own line
- Include ALL verses from the chapter
- Do not add any commentary, explanations, or additional text
- Use the actual NIV translation text`,
        add_context_from_internet: true
      });

      setBibleText(response);
    } catch (error) {
      console.error('Error fetching Bible text:', error);
      setBibleText('Unable to load Bible text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentChapter) {
      fetchBibleText(currentChapter.book, currentChapter.chapter_number);
      stopSpeech(); // Stop any ongoing speech when chapter changes
    }
  }, [isOpen, currentChapter?.id]);

  // Text-to-speech functionality
  const getVoice = () => {
    if (!window.speechSynthesis) return null;
    
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer natural-sounding voices
    const preferredVoices = voiceGender === 'female' 
      ? voices.filter(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira'))
      : voices.filter(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark'));
    
    if (preferredVoices.length > 0) return preferredVoices[0];
    
    // Fallback to any English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    return englishVoices[0] || voices[0];
  };

  const startSpeech = () => {
    if (!window.speechSynthesis || !bibleText) return;

    stopSpeech(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(bibleText);
    const voice = getVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis && isSpeaking) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < eraChapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Load voices when available
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-serif">
            <BookOpen className="w-6 h-6 text-amber-600" />
            {currentChapter ? `${currentChapter.book} ${currentChapter.chapter_number}` : 'Bible Reader'}
          </DialogTitle>
        </DialogHeader>

        {/* Navigation */}
        {eraChapters.length > 1 && (
          <div className="flex items-center justify-between gap-3 py-3 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
            >
              <SkipBack className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-stone-600">
              Chapter {currentChapterIndex + 1} of {eraChapters.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextChapter}
              disabled={currentChapterIndex === eraChapters.length - 1}
            >
              Next
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Audio Controls */}
        <div className="bg-stone-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={isSpeaking ? stopSpeech : startSpeech}
              disabled={loading || !bibleText}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop Reading
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Read Aloud
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button
                onClick={pauseSpeech}
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            <div className="flex-1" />

            {/* Voice Settings */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-stone-600" />
                <Select value={voiceGender} onValueChange={setVoiceGender}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female Voice</SelectItem>
                    <SelectItem value="male">Male Voice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600">Speed:</span>
                <div className="w-32">
                  <Slider
                    value={[speechRate]}
                    onValueChange={(value) => setSpeechRate(value[0])}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                  />
                </div>
                <span className="text-sm text-stone-600 w-8">{speechRate.toFixed(1)}x</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-500">
            Select voice gender and adjust reading speed to your preference. Settings are saved automatically.
          </p>
        </div>

        {/* Bible Text */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
              <p className="text-stone-600">Loading scripture...</p>
            </div>
          ) : bibleText ? (
            <div className="prose prose-stone max-w-none p-6 bg-amber-50/30 rounded-xl">
              <div className="font-serif leading-relaxed text-stone-800 whitespace-pre-wrap">
                {bibleText}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-stone-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No Bible text available</p>
            </div>
          )}
        </div>

        {/* Chapter Info */}
        {currentChapter && (
          <div className="border-t pt-4 space-y-2">
            {currentChapter.key_verse && (
              <div>
                <p className="text-xs text-stone-500 font-semibold">Key Verse:</p>
                <p className="text-sm text-stone-700 italic">"{currentChapter.key_verse}"</p>
              </div>
            )}
            {currentChapter.summary && (
              <div>
                <p className="text-xs text-stone-500 font-semibold">Summary:</p>
                <p className="text-sm text-stone-700">{currentChapter.summary}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}