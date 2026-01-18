import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, BookOpen, Target, HelpCircle, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function BibleStudyAI() {
  const [activeMode, setActiveMode] = useState('commentary');
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const modes = {
    commentary: {
      icon: BookOpen,
      title: 'Bible Commentary',
      placeholder: 'Enter a Bible verse or chapter (e.g., "John 3:16" or "Psalm 23")',
      systemPrompt: 'You are a knowledgeable Bible scholar providing thoughtful commentary and context on scripture. Explain historical context, cultural significance, key themes, and practical applications. Be respectful, educational, and accessible to all levels of Bible knowledge.'
    },
    study_plan: {
      icon: Target,
      title: 'Study Plan Generator',
      placeholder: 'Share your interests or goals (e.g., "I want to learn about faith" or "Help me understand the Gospels")',
      systemPrompt: 'You are a Bible study planner. Create personalized, structured Bible study plans based on user interests and goals. Include specific chapters to read, themes to explore, reflection questions, and a suggested timeline. Make plans practical and achievable.'
    },
    questions: {
      icon: HelpCircle,
      title: 'Theological Q&A',
      placeholder: 'Ask any theological or biblical question...',
      systemPrompt: 'You are a thoughtful theologian answering questions about Christianity, the Bible, and faith. Provide balanced, well-informed responses that acknowledge different theological perspectives when relevant. Support answers with scripture references. Be respectful and pastoral in tone.'
    },
    summaries: {
      icon: FileText,
      title: 'Topic Summaries',
      placeholder: 'Enter a biblical topic (e.g., "grace", "redemption", "the Trinity")',
      systemPrompt: 'You are a Bible teacher summarizing complex biblical topics. Provide clear, comprehensive overviews that explain key concepts, relevant scripture passages, historical development, and practical significance. Make complex theology accessible.'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = { role: 'user', content: userInput };
    setConversation([...conversation, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const mode = modes[activeMode];
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${mode.systemPrompt}\n\nUser query: ${userInput}`,
        add_context_from_internet: false
      });

      const aiMessage = { role: 'assistant', content: response };
      setConversation(prev => [...prev, aiMessage]);
      
      // Track usage
      base44.analytics.track({
        eventName: 'ai_bible_study_query',
        properties: { mode: activeMode }
      });
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setUserInput('');
  };

  const currentMode = modes[activeMode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-serif font-bold text-stone-800 mb-4"
          >
            AI Bible Study Assistant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-stone-600 max-w-2xl mx-auto"
          >
            Deepen your understanding of scripture with AI-powered insights, study plans, and answers to your faith questions
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeMode} onValueChange={(val) => { setActiveMode(val); clearConversation(); }}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
              {Object.entries(modes).map(([key, mode]) => (
                <TabsTrigger key={key} value={key} className="rounded-lg">
                  <mode.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{mode.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(modes).map(([key, mode]) => (
              <TabsContent key={key} value={key}>
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <mode.icon className="w-6 h-6 text-blue-600" />
                      {mode.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Conversation History */}
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                      {conversation.length === 0 ? (
                        <div className="text-center py-12 text-stone-500">
                          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                          <p>Start a conversation to explore scripture with AI guidance</p>
                        </div>
                      ) : (
                        conversation.map((message, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-100 ml-8'
                                : 'bg-stone-100 mr-8'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {message.role === 'assistant' && (
                                <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                              )}
                              <p className="text-stone-800 whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </motion.div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex items-center gap-2 p-4 bg-stone-100 rounded-lg mr-8">
                          <Bot className="w-5 h-5 text-blue-600" />
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-stone-600">Thinking...</span>
                        </div>
                      )}
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={mode.placeholder}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        {conversation.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearConversation}
                          >
                            Clear
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={isLoading || !userInput.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Deep Commentary</h3>
                <p className="text-sm text-stone-600">
                  Get historical context, cultural insights, and theological perspectives on any passage
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <Target className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Personalized Plans</h3>
                <p className="text-sm text-stone-600">
                  Generate custom Bible study plans tailored to your interests and spiritual goals
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <HelpCircle className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Ask Anything</h3>
                <p className="text-sm text-stone-600">
                  Explore theological questions with thoughtful, scripture-based answers
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <FileText className="w-8 h-8 text-pink-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Clear Summaries</h3>
                <p className="text-sm text-stone-600">
                  Understand complex biblical topics with accessible, comprehensive overviews
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}