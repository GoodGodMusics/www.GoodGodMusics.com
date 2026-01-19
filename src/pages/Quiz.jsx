import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Trophy, Award, Clock, ChevronRight, 
  CheckCircle2, XCircle, Star, Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Quiz() {
  const [user, setUser] = useState(null);
  const [quizType, setQuizType] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  const queryClient = useQueryClient();

  const bibleBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

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

  const { data: attempts = [] } = useQuery({
    queryKey: ['quizAttempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ['rewardTokens', user?.email],
    queryFn: () => base44.entities.RewardToken.filter({ user_email: user.email, is_redeemed: false }),
    enabled: !!user
  });

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.QuizAttempt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizAttempts'] });
    }
  });

  const createTokenMutation = useMutation({
    mutationFn: (data) => base44.entities.RewardToken.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewardTokens'] });
    }
  });

  const startQuiz = async (type) => {
    if (!user) {
      alert('Please log in to take a quiz');
      return;
    }

    setQuizType(type);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizStartTime(Date.now());
    setShowResults(false);

    let questions = [];
    if (type === 'general') {
      questions = await generateGeneralQuestions(20);
    } else if (type === 'book' && selectedBook) {
      questions = await generateBookQuestions(selectedBook, 20);
    } else if (type === 'chapter' && selectedBook && selectedChapter) {
      questions = await generateChapterQuestions(selectedBook, selectedChapter, 10);
    }

    setCurrentQuiz(questions);
  };

  const generateGeneralQuestions = async (count) => {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${count} diverse multiple choice Bible trivia questions covering both Old and New Testament. 
      Each question should have 4 options (A, B, C, D) with only one correct answer.
      Cover various topics: people, events, teachings, books, prophecies, miracles, parables, etc.
      Make questions challenging but fair.`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  }
                },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });
    return response.questions;
  };

  const generateBookQuestions = async (book, count) => {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${count} multiple choice questions specifically about the book of ${book} from the Bible.
      Cover key events, characters, themes, and teachings from this book.
      Each question should have 4 options (A, B, C, D) with only one correct answer.`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  }
                },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });
    return response.questions;
  };

  const generateChapterQuestions = async (book, chapter, count) => {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${count} multiple choice questions about ${book} chapter ${chapter}.
      Focus on specific verses, events, and teachings from this chapter.
      Each question should have 4 options (A, B, C, D) with only one correct answer.`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  }
                },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });
    return response.questions;
  };

  const handleAnswer = (option) => {
    setAnswers({ ...answers, [currentQuestion]: option });
  };

  const nextQuestion = () => {
    if (currentQuestion < currentQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const completionTime = Math.floor((Date.now() - quizStartTime) / 1000);
    let correctCount = 0;

    currentQuiz.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    const totalQuestions = currentQuiz.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const perfectScore = score === 100;

    const results = {
      score,
      correctCount,
      totalQuestions,
      perfectScore,
      completionTime
    };

    setQuizResults(results);
    setShowResults(true);

    const attemptData = {
      user_email: user.email,
      quiz_type: quizType,
      book_name: selectedBook || null,
      chapter_number: selectedChapter || null,
      questions: currentQuiz.map((q, idx) => ({
        ...q,
        user_answer: answers[idx],
        is_correct: answers[idx] === q.correct_answer
      })),
      score,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      reward_earned: perfectScore,
      completion_time_seconds: completionTime
    };

    const attempt = await createAttemptMutation.mutateAsync(attemptData);

    if (perfectScore) {
      await createTokenMutation.mutateAsync({
        user_email: user.email,
        earned_from_quiz_id: attempt.id
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizType(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setQuizResults(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-600 mb-4">Please log in to take quizzes and track your progress.</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && quizResults) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {quizResults.perfectScore ? (
                    <Trophy className="w-20 h-20 text-amber-500" />
                  ) : quizResults.score >= 70 ? (
                    <Award className="w-20 h-20 text-blue-500" />
                  ) : (
                    <BookOpen className="w-20 h-20 text-stone-500" />
                  )}
                </div>
                <CardTitle className="text-4xl">
                  {quizResults.perfectScore ? 'Perfect Score!' : 
                   quizResults.score >= 70 ? 'Well Done!' : 'Keep Studying!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl font-bold text-amber-600">
                  {quizResults.score}%
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{quizResults.correctCount}</div>
                    <div className="text-sm text-stone-600">Correct</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {quizResults.totalQuestions - quizResults.correctCount}
                    </div>
                    <div className="text-sm text-stone-600">Incorrect</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{quizResults.completionTime}s</div>
                    <div className="text-sm text-stone-600">Time</div>
                  </div>
                </div>

                {quizResults.perfectScore && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-6 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl"
                  >
                    <Gift className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                    <div className="text-xl font-bold text-amber-900 mb-2">
                      🎉 Reward Token Earned!
                    </div>
                    <p className="text-amber-800">
                      Visit the Reward Center to redeem your token for a beautiful scripture meme!
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button onClick={resetQuiz} variant="outline">
                    Take Another Quiz
                  </Button>
                  <Link to={createPageUrl('RewardCenter')}>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <Gift className="w-4 h-4 mr-2" />
                      Reward Center ({tokens.length} tokens)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentQuiz) {
    const question = currentQuiz[currentQuestion];
    const progress = ((currentQuestion + 1) / currentQuiz.length) * 100;

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-stone-600">
                Question {currentQuestion + 1} of {currentQuiz.length}
              </span>
              <span className="text-sm text-stone-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <Button
                  key={key}
                  variant={answers[currentQuestion] === key ? 'default' : 'outline'}
                  className={`w-full justify-start text-left h-auto py-4 px-6 ${
                    answers[currentQuestion] === key ? 'bg-amber-600 hover:bg-amber-700' : ''
                  }`}
                  onClick={() => handleAnswer(key)}
                >
                  <span className="font-bold mr-3">{key}.</span>
                  <span>{value}</span>
                </Button>
              ))}

              <Button
                onClick={nextQuestion}
                disabled={!answers[currentQuestion]}
                className="w-full mt-6 bg-stone-800 hover:bg-stone-900"
              >
                {currentQuestion < currentQuiz.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Finish Quiz'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">
            Take a Bible Quiz
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Test your biblical knowledge and earn reward tokens for perfect scores!
          </p>
          <div className="mt-4">
            <Badge className="bg-amber-100 text-amber-800 text-base px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              {tokens.length} Reward Tokens Available
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="quiz" className="mb-12">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="quiz">Take Quiz</TabsTrigger>
            <TabsTrigger value="history">Quiz History</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <BookOpen className="w-12 h-12 text-amber-600 mb-3" />
                  <CardTitle>General Bible Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 mb-4">
                    20 randomized questions covering the entire Bible
                  </p>
                  <Button 
                    onClick={() => startQuiz('general')}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Star className="w-12 h-12 text-blue-600 mb-3" />
                  <CardTitle>Book-Specific Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 mb-4">
                    20 questions about a specific Bible book
                  </p>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleBooks.map(book => (
                        <SelectItem key={book} value={book}>{book}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => startQuiz('book')}
                    disabled={!selectedBook}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Trophy className="w-12 h-12 text-green-600 mb-3" />
                  <CardTitle>Chapter Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 mb-4">
                    10 questions about a specific chapter
                  </p>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleBooks.map(book => (
                        <SelectItem key={book} value={book}>{book}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedChapter} 
                    onValueChange={(val) => setSelectedChapter(parseInt(val))}
                    disabled={!selectedBook}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => startQuiz('chapter')}
                    disabled={!selectedBook || !selectedChapter}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {attempts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-600">No quiz attempts yet. Start your first quiz!</p>
                  </CardContent>
                </Card>
              ) : (
                attempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={attempt.reward_earned ? 'default' : 'outline'}>
                            {attempt.quiz_type === 'general' ? 'General' :
                             attempt.quiz_type === 'book' ? `Book: ${attempt.book_name}` :
                             `${attempt.book_name} ${attempt.chapter_number}`}
                          </Badge>
                          {attempt.reward_earned && (
                            <Trophy className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        <div className="text-sm text-stone-600">
                          {new Date(attempt.created_date).toLocaleDateString()} • 
                          {attempt.correct_answers}/{attempt.total_questions} correct • 
                          {attempt.completion_time_seconds}s
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-amber-600">
                        {attempt.score}%
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}