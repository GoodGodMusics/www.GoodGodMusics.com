import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2, BookOpen, Settings, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceGender, setVoiceGender] = useState('female');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [parsedVerses, setParsedVerses] = useState([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const utteranceRef = useRef(null);
  const voicesLoadedRef = useRef(false);
  const [useResponsiveVoice, setUseResponsiveVoice] = useState(false);

  // Get user preferences from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem('bible_speech_rate');
    const savedGender = localStorage.getItem('bible_voice_gender');
    const savedVolume = localStorage.getItem('bible_speech_volume');
    const savedMuted = localStorage.getItem('bible_is_muted');

    if (savedRate) setSpeechRate(parseFloat(savedRate));
    if (savedGender) setVoiceGender(savedGender);
    if (savedVolume) setSpeechVolume(parseFloat(savedVolume));
    if (savedMuted) setIsMuted(savedMuted === 'true');
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('bible_speech_rate', speechRate.toString());
    localStorage.setItem('bible_voice_gender', voiceGender);
    localStorage.setItem('bible_speech_volume', speechVolume.toString());
    localStorage.setItem('bible_is_muted', isMuted.toString());
  }, [speechRate, voiceGender, speechVolume, isMuted]);

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
      
      // Parse verses from the response
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

  // Check for ResponsiveVoice availability
  useEffect(() => {
    const checkResponsiveVoice = () => {
      if (window.responsiveVoice) {
        setUseResponsiveVoice(true);
        voicesLoadedRef.current = true;
      } else {
        if (window.speechSynthesis) {
          const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              voicesLoadedRef.current = true;
            }
          };
          
          window.speechSynthesis.onvoiceschanged = loadVoices;
          loadVoices();
        }
      }
    };

    checkResponsiveVoice();
    const timer = setTimeout(checkResponsiveVoice, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getVoice = () => {
    if (!window.speechSynthesis) return null;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    
    const filterVoices = (gender, queryKeywords) => {
      return voices.filter(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes(gender) || queryKeywords.some(keyword => v.name.toLowerCase().includes(keyword))) 
      );
    };

    let preferredVoices;
    if (voiceGender === 'female') {
      preferredVoices = filterVoices('female', ['samantha', 'zira', 'helena', 'karen', 'victoria']);
    } else {
      preferredVoices = filterVoices('male', ['david', 'alex', 'daniel', 'mark', 'tom']);
    }

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

    const onVerseEnd = () => {
      speakVerse(index + 1);
    };

    if (useResponsiveVoice && window.responsiveVoice) {
      const voiceName = voiceGender === 'female' ? 'US English Female' : 'US English Male';
      
      const params = {
        rate: speechRate,
        pitch: voiceGender === 'female' ? 1.05 : 0.85,
        volume: isMuted ? 0 : speechVolume,
        onstart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
        },
        onend: onVerseEnd,
        onerror: (error) => {
          console.error('ResponsiveVoice error on verse', index + 1, ':', error);
          onVerseEnd();
        }
      };

      window.responsiveVoice.speak(text, voiceName, params);
      setIsSpeaking(true);
      return;
    }

    speakVerseBrowser(text, onVerseEnd);
  };

  const speakVerseBrowser = (text, onVerseEnd) => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : speechVolume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = onVerseEnd;

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      onVerseEnd();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = (startIndex = 0) => {
    if (!parsedVerses.length || loading) return;
    stopSpeech();
    speakVerse(startIndex);
  };

  const stopSpeech = () => {
    if (useResponsiveVoice && window.responsiveVoice) {
      window.responsiveVoice.cancel();
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentVerseIndex(-1);
  };

  const togglePauseResume = () => {
    if (!isSpeaking) return;

    if (useResponsiveVoice && window.responsiveVoice) {
      if (isPaused) {
        window.responsiveVoice.resume();
        setIsPaused(false);
      } else {
        window.responsiveVoice.pause();
        setIsPaused(true);
      }
      return;
    }

    if (window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setSpeechVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    
    if (isSpeaking && useResponsiveVoice && window.responsiveVoice) {
      window.responsiveVoice.setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (isSpeaking && useResponsiveVoice && window.responsiveVoice) {
      window.responsiveVoice.setVolume(newMutedState ? 0 : speechVolume);
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
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-stone-600 hover:bg-stone-200"
              >
                {isMuted || speechVolume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : speechVolume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                />
              </div>
              <span className="text-xs text-stone-600 w-8">{Math.round((isMuted ? 0 : speechVolume) * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-stone-600" />
              <Select 
                value={voiceGender} 
                onValueChange={(newGender) => {
                  setVoiceGender(newGender);
                  if (isSpeaking && currentVerseIndex !== -1) {
                    stopSpeech();
                    setTimeout(() => startSpeech(currentVerseIndex), 100);
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Soft Female</SelectItem>
                  <SelectItem value="male">Deep Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <p className="text-xs text-stone-500">
            Click any verse to start reading from that point. Each verse is read individually for better reliability.
            {useResponsiveVoice && <span className="text-amber-600 font-semibold"> • Premium voice quality active</span>}
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