import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, BookOpen, Target, HelpCircle, Loader2, Copy, Check, History, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BibleStudyAI() {
  const [activeMode, setActiveMode] = useState('commentary');
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const { data: conversationHistories = [] } = useQuery({
    queryKey: ['aiConversations', currentUser?.email, activeMode],
    queryFn: () => {
      if (!currentUser) return [];
      return base44.entities.AIConversationHistory.filter({ 
        user_email: currentUser.email,
        conversation_mode: activeMode 
      }, '-last_updated', 20);
    },
    enabled: !!currentUser
  });

  const saveConversationMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || conversation.length === 0) return;
      
      const title = conversation.find(m => m.role === 'user')?.content.slice(0, 50) || 'Conversation';
      
      if (currentConversationId) {
        await base44.entities.AIConversationHistory.update(currentConversationId, {
          messages: conversation.map(m => ({ ...m, timestamp: new Date().toISOString() })),
          last_updated: new Date().toISOString()
        });
      } else {
        const newConv = await base44.entities.AIConversationHistory.create({
          user_email: currentUser.email,
          conversation_mode: activeMode,
          conversation_title: title,
          messages: conversation.map(m => ({ ...m, timestamp: new Date().toISOString() })),
          last_updated: new Date().toISOString()
        });
        setCurrentConversationId(newConv.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConversations'] });
    }
  });

  const loadConversation = (history) => {
    setConversation(history.messages || []);
    setCurrentConversationId(history.id);
  };

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
      setConversation(prev => {
        const updated = [...prev, aiMessage];
        return updated;
      });
      
      // Track usage
      base44.analytics.track({
        eventName: 'ai_bible_study_query',
        properties: { mode: activeMode }
      });

      // Auto-save conversation after AI response
      setTimeout(() => saveConversationMutation.mutate(), 500);
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
    setCurrentConversationId(null);
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
              {Object.entries(modes).map(([key, mode]) => (
                <TabsTrigger key={key} value={key} className="rounded-lg">
                  <mode.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{mode.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(modes).map(([key, mode]) => (
              <TabsContent key={key} value={key}>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
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
                              <div className="flex-1">
                                <p className="text-stone-800 whitespace-pre-wrap">{message.content}</p>
                                {message.role === 'assistant' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(message.content, idx)}
                                    className="mt-2 text-xs"
                                  >
                                    {copiedIndex === idx ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy Response
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
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
                  </div>

                  {/* Conversation History Sidebar */}
                  {currentUser && (
                    <div className="md:col-span-1">
                      <Card className="bg-white/80 backdrop-blur-sm sticky top-24">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Chat History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {conversationHistories.length === 0 ? (
                              <p className="text-sm text-stone-500 text-center py-6">
                                No saved conversations yet. Start chatting to build your history!
                              </p>
                            ) : (
                              conversationHistories.map(history => (
                                <button
                                  key={history.id}
                                  onClick={() => loadConversation(history)}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    currentConversationId === history.id
                                      ? 'bg-blue-100 border-blue-300'
                                      : 'bg-white hover:bg-stone-50 border-stone-200'
                                  }`}
                                >
                                  <p className="text-sm font-medium text-stone-800 line-clamp-2 mb-1">
                                    {history.conversation_title}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-stone-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(history.last_updated).toLocaleDateString()}
                                  </div>
                                  <Badge className="mt-2 text-xs" variant="outline">
                                    {history.messages?.length || 0} messages
                                  </Badge>
                                </button>
                              ))
                            )}
                          </div>
                          {conversation.length > 0 && currentUser && (
                            <Button
                              onClick={() => saveConversationMutation.mutate()}
                              size="sm"
                              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                              disabled={saveConversationMutation.isPending}
                            >
                              {currentConversationId ? 'Update Saved' : 'Save Conversation'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
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
                <History className="w-8 h-8 text-pink-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Conversation History</h3>
                <p className="text-sm text-stone-600">
                  Save and revisit your past theological discussions and Bible study sessions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}