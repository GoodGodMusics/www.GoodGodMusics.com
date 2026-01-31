import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2, BookOpen, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Load ResponsiveVoice library
if (typeof window !== 'undefined' && !window.responsiveVoiceLoaded) {
  const script = document.createElement('script');
  script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=jQZ2zSby';
  script.async = true;
  document.head.appendChild(script);
  window.responsiveVoiceLoaded = true;
}

export default function BibleReaderModal({ isOpen, onClose, chapter, eraChapters = [] }) {
  const [bibleText, setBibleText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.2);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [parsedVerses, setParsedVerses] = useState([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const bibleTextCacheRef = useRef({});

  // Get user preferences from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem('bible_speech_rate');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('bible_speech_rate', speechRate.toString());
  }, [speechRate]);

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

  // Fetch Bible text with caching
  const fetchBibleText = async (book, chapterNum) => {
    const cacheKey = `${book}_${chapterNum}`;
    
    // Check cache first
    if (bibleTextCacheRef.current[cacheKey]) {
      const cached = bibleTextCacheRef.current[cacheKey];
      setBibleText(cached.text);
      setParsedVerses(cached.verses);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${book} ${chapterNum} NIV. Format: heading, then verses as "1 [text]", "2 [text]", etc.`,
        add_context_from_internet: true
      });

      setBibleText(response);
      
      // Parse verses
      const lines = response.split('\n').filter(line => line.trim());
      const verses = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\d+)\s+(.*)/);
        if (match && match[2]) {
          verses.push(match[2].trim());
        }
      }
      
      setParsedVerses(verses);
      
      // Cache the result
      bibleTextCacheRef.current[cacheKey] = { text: response, verses };
    } catch (error) {
      console.error('Error fetching Bible text:', error);
      setBibleText('Unable to load Bible text. Please try again.');
      setParsedVerses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentChapter) {
      fetchBibleText(currentChapter.book, currentChapter.chapter_number);
      stopSpeech();
      setCurrentVerseIndex(-1);
    }
  }, [isOpen, currentChapter?.id]);

  const getVoice = () => {
    if (!window.speechSynthesis) return null;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    
    // Always use female voice
    const preferredVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       ['samantha', 'zira', 'helena', 'karen', 'victoria'].some(keyword => 
         v.name.toLowerCase().includes(keyword)
       ))
    );

    if (preferredVoices.length > 0) return preferredVoices[0];
    
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    return englishVoice || voices[0];
  };

  const speakVerse = (index) => {
    if (index >= parsedVerses.length || index < 0) {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentVerseIndex(-1);
      return;
    }

    const text = parsedVerses[index];
    setCurrentVerseIndex(index);

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Clear any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // Move to next verse only after current completes
      if (index < parsedVerses.length - 1) {
        speakVerse(index + 1);
      } else {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentVerseIndex(-1);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      setCurrentVerseIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = (startIndex = 0) => {
    if (!parsedVerses.length || loading) return;
    stopSpeech();
    setTimeout(() => speakVerse(startIndex), 50);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentVerseIndex(-1);
  };

  const togglePauseResume = () => {
    if (!window.speechSynthesis) return;

    if (isPaused) {
      // Resume from current verse beginning
      setIsPaused(false);
      speakVerse(currentVerseIndex);
    } else if (isSpeaking) {
      // Pause
      window.speechSynthesis.cancel();
      setIsPaused(true);
    }
  };

  const handleVerseClick = (index) => {
    startSpeech(index);
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

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const renderVerses = () => {
    if (!parsedVerses.length) {
      if (bibleText) {
        return <p className="text-red-500">Error parsing verses. Please try again.</p>;
      }
      return null;
    }

    const chapterHeading = bibleText.split('\n')[0];

    return (
      <>
        {chapterHeading && <p className="text-xl font-bold mb-4">{chapterHeading}</p>}
        {parsedVerses.map((verseText, index) => {
          const isCurrent = currentVerseIndex === index;
          return (
            <p
              key={index}
              onClick={() => handleVerseClick(index)}
              className={`
                mb-2 cursor-pointer hover:bg-amber-100 hover:shadow-sm
                rounded px-2 py-1 transition-all duration-200
                ${isCurrent ? 'bg-yellow-200 shadow-md' : ''}
              `}
              title="Click to read from here"
            >
              <span className="font-semibold text-amber-700 mr-2">{index + 1}</span>
              {verseText}
            </p>
          );
        })}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-serif">
            <BookOpen className="w-6 h-6 text-amber-600" />
            {currentChapter ? `${currentChapter.book} ${currentChapter.chapter_number}` : 'Bible Reader'}
          </DialogTitle>
        </DialogHeader>

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

        <div className="bg-stone-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => startSpeech(0)}
              disabled={loading || !parsedVerses.length}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking ? 'Reading...' : 'Read Aloud'}
            </Button>

            {isSpeaking && (
              <>
                <Button
                  onClick={togglePauseResume}
                  variant="outline"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>

                <Button
                  onClick={stopSpeech}
                  variant="outline"
                >
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600">Speed:</span>
              <div className="w-32">
                <Slider
                  value={[speechRate]}
                  onValueChange={(value) => setSpeechRate(value[0])}
                  min={0.8}
                  max={2.0}
                  step={0.1}
                />
              </div>
              <span className="text-sm text-stone-600 w-8">{speechRate.toFixed(1)}x</span>
            </div>
          </div>

          <p className="text-xs text-stone-500">
            Click any verse to start reading from that point. Audio plays at standard volume - use device controls to adjust.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
              <p className="text-stone-600">Loading scripture...</p>
            </div>
          ) : bibleText ? (
            <div className="prose prose-stone max-w-none p-6 bg-amber-50/30 rounded-xl">
              <div className="font-serif leading-relaxed text-stone-800">
                {renderVerses()}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-stone-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No Bible text available</p>
            </div>
          )}
        </div>

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