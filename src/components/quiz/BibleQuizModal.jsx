import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Award, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

export default function BibleQuizModal({ isOpen, onClose, bookName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [quizState, setQuizState] = useState('loading'); // loading, quiz, results
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        alert('Please log in to take quizzes');
        onClose();
      }
    };
    if (isOpen) getUser();
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && currentUser && bookName) {
      generateQuiz();
    }
  }, [isOpen, currentUser, bookName]);

  const generateQuiz = async () => {
    setQuizState('loading');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 10 multiple choice questions about the Bible book "${bookName}". 
        
Questions should cover:
- Key events and stories
- Main characters
- Important verses and themes
- Historical context
- Spiritual lessons

Each question should have 4 answer options with only ONE correct answer.

Return a JSON array of 10 questions.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setQuestions(result.questions);
      setQuizState('quiz');
      setStartTime(Date.now());
      setUserAnswers(new Array(10).fill(null));
    } catch (error) {
      alert('Failed to generate quiz. Please try again.');
      onClose();
    }
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const correctCount = userAnswers.reduce((count, answer, index) => {
      return answer === questions[index].correct_answer ? count + 1 : count;
    }, 0);

    const points = correctCount >= 6 ? correctCount : 0;
    const completionTime = Math.floor((Date.now() - startTime) / 1000);

    setScore(correctCount);
    setPointsEarned(points);
    setQuizState('results');

    // Trigger confetti for good scores
    if (correctCount >= 8) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save quiz results
    try {
      await base44.entities.Quiz.create({
        user_email: currentUser.email,
        book_name: bookName,
        questions_data: questions.map((q, i) => ({
          question: q.question,
          user_answer: userAnswers[i],
          correct_answer: q.correct_answer,
          was_correct: userAnswers[i] === q.correct_answer
        })),
        score: correctCount,
        points_earned: points,
        completion_time_seconds: completionTime
      });

      // Update user stats
      const isPerfect = correctCount === 10;
      await base44.auth.updateMe({
        prayer_points: (currentUser.prayer_points || 0) + points,
        total_quizzes_taken: (currentUser.total_quizzes_taken || 0) + 1,
        perfect_scores: (currentUser.perfect_scores || 0) + (isPerfect ? 1 : 0)
      });
    } catch (error) {
      console.error('Failed to save quiz results:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bible Quiz</h2>
                <p className="text-amber-100 text-sm">{bookName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {quizState === 'loading' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
                <p className="text-stone-600">Generating your personalized quiz...</p>
              </div>
            )}

            {quizState === 'quiz' && questions.length > 0 && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-stone-600">
                    Question {currentQuestion + 1} of 10
                  </span>
                  <div className="flex gap-1">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === currentQuestion
                            ? 'bg-amber-600'
                            : userAnswers[i] !== null
                            ? 'bg-green-500'
                            : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-stone-800 mb-6">
                      {questions[currentQuestion].question}
                    </h3>

                    <div className="space-y-3">
                      {questions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            userAnswers[currentQuestion] === index
                              ? 'border-amber-600 bg-amber-50'
                              : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                userAnswers[currentQuestion] === index
                                  ? 'border-amber-600 bg-amber-600'
                                  : 'border-stone-300'
                              }`}
                            >
                              {userAnswers[currentQuestion] === index && (
                                <div className="w-3 h-3 bg-white rounded-full" />
                              )}
                            </div>
                            <span className="text-stone-700">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={userAnswers[currentQuestion] === null}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {currentQuestion === 9 ? 'Finish Quiz' : 'Next Question'}
                  </Button>
                </div>
              </div>
            )}

            {quizState === 'results' && (
              <div className="space-y-6">
                {/* Score Card */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                      {score}
                    </div>
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">
                      {score === 10
                        ? '🎉 Perfect Score!'
                        : score >= 8
                        ? '🌟 Excellent!'
                        : score >= 6
                        ? '👍 Good Job!'
                        : 'Keep Studying!'}
                    </h3>
                    <p className="text-stone-600 mb-4">
                      You got {score} out of 10 questions correct
                    </p>

                    <div className="flex items-center justify-center gap-6 py-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-600">
                          <Award className="w-6 h-6" />
                          +{pointsEarned}
                        </div>
                        <p className="text-xs text-stone-500">Prayer Points</p>
                      </div>
                    </div>

                    {pointsEarned === 0 && (
                      <p className="text-sm text-stone-500 mt-2">
                        Score 6+ to earn prayer points!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Answer Review */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-stone-800">Review Your Answers</h4>
                  {questions.map((q, i) => (
                    <Card key={i} className={userAnswers[i] === q.correct_answer ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {userAnswers[i] === q.correct_answer ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-stone-800 mb-2">{q.question}</p>
                            <p className="text-sm text-stone-600">
                              <span className="font-semibold">Correct Answer:</span> {q.options[q.correct_answer]}
                            </p>
                            {q.explanation && (
                              <p className="text-sm text-stone-500 mt-1 italic">{q.explanation}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  onClick={onClose}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}