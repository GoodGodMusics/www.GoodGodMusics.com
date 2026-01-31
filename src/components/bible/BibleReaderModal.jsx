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

  // Check for ResponsiveVoice availability
  useEffect(() => {
    const checkResponsiveVoice = () => {
      if (window.responsiveVoice) {
        setUseResponsiveVoice(true);
        voicesLoadedRef.current = true;
      } else {
        // Fallback to browser speech synthesis
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

    // Check immediately and after a delay for ResponsiveVoice to load
    checkResponsiveVoice();
    const timer = setTimeout(checkResponsiveVoice, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Text-to-speech functionality
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
    
    // Fallback to any English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    return englishVoice || voices[0];
  };

  const startSpeech = (textToSpeak = null) => {
    if ((!bibleText && !textToSpeak) || loading) return;

    stopSpeech(); // Stop any ongoing speech

    const text = textToSpeak || bibleText;

    // Use ResponsiveVoice if available (more reliable)
    if (useResponsiveVoice && window.responsiveVoice) {
      const voiceName = voiceGender === 'female' ? 'US English Female' : 'US English Male';
      const params = {
        rate: speechRate,
        pitch: 1,
        volume: isMuted ? 0 : speechVolume,
        onstart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
        },
        onend: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onerror: (error) => {
          console.error('ResponsiveVoice error:', error);
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };

      window.responsiveVoice.speak(text, voiceName, params);
      setIsSpeaking(true);
      return;
    }

    // Fallback to browser speech synthesis
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in your browser. Please try Chrome, Edge, or Safari.');
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

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      alert('Speech failed. Try using a different browser or reload the page.');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    // Stop ResponsiveVoice if it's being used
    if (useResponsiveVoice && window.responsiveVoice) {
      window.responsiveVoice.cancel();
    }
    
    // Also stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const togglePauseResume = () => {
    if (!isSpeaking) return;

    // ResponsiveVoice pause/resume
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

    // Browser speech synthesis pause/resume
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
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleTextClick = (clickedText) => {
    if (!bibleText || !clickedText.trim()) return;
    
    // Find the position in the full text
    const fullText = bibleText;
    const clickPosition = fullText.indexOf(clickedText);
    
    if (clickPosition !== -1) {
      // Start reading from the clicked position to the end
      const textFromPosition = fullText.substring(clickPosition);
      startSpeech(textFromPosition);
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

  // Split text into lines for clickable verses
  const renderClickableText = () => {
    if (!bibleText) return null;
    
    const lines = bibleText.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => (
      <p
        key={index}
        onClick={() => handleTextClick(line)}
        className={`
          mb-2 cursor-pointer hover:bg-amber-100 hover:shadow-sm 
          rounded px-2 py-1 transition-all duration-200
          ${index === 0 ? 'text-xl font-bold mb-4' : ''}
        `}
        title="Click to read from here"
      >
        {line}
      </p>
    ));
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
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => startSpeech()}
              disabled={loading || !bibleText || isSpeaking}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Read Aloud
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

            {/* Volume Control */}
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
            {/* Voice Settings */}
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

          <p className="text-xs text-stone-500">
            Click any verse to start reading from that point. Volume, voice, and speed settings are saved automatically.
            {useResponsiveVoice && <span className="text-amber-600 font-semibold"> • Enhanced voice quality active</span>}
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
              <div className="font-serif leading-relaxed text-stone-800">
                {renderClickableText()}
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