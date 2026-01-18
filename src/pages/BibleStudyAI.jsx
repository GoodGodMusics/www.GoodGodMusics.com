import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, BookOpen, Sparkles, Loader2, User, Bot, Lightbulb, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function BibleStudyAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestedPrompts = [
    { icon: BookOpen, text: "Explain the meaning of John 3:16", category: "Commentary" },
    { icon: Calendar, text: "Create a 30-day study plan for the book of Romans", category: "Study Plan" },
    { icon: MessageSquare, text: "What does the Bible say about faith and works?", category: "Theology" },
    { icon: Lightbulb, text: "Summarize the main themes in the Book of Psalms", category: "Summary" }
  ];

  const handleSend = async (prompt = input) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are a knowledgeable and compassionate Bible study assistant. Your role is to:

1. Provide accurate biblical context, commentary, and explanations
2. Generate personalized Bible study plans based on user goals and interests
3. Answer theological questions with scriptural references and balanced perspectives
4. Summarize complex biblical topics clearly and accessibly
5. Always maintain respect for different denominations and interpretations
6. Cite specific Bible verses when relevant
7. Be encouraging and supportive in your tone

User question: ${prompt}

Provide a helpful, biblically-grounded response.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        add_context_from_internet: false
      });

      const aiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (promptText) => {
    setInput(promptText);
    handleSend(promptText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800">
              AI Bible Study Assistant
            </h1>
          </div>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Your personal guide to deeper biblical understanding, powered by AI
          </p>
        </motion.div>

        {/* Suggested Prompts (shown when no messages) */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h3 className="text-center text-stone-700 font-semibold mb-4">Try asking:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {suggestedPrompts.map((prompt, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePromptClick(prompt.text)}
                  className="p-4 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <prompt.icon className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <Badge className="mb-2 bg-purple-100 text-purple-800">{prompt.category}</Badge>
                      <p className="text-stone-700">{prompt.text}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-purple-200">
          <CardContent className="p-6">
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <p>Ask me anything about the Bible, theology, or Bible study!</p>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-stone-100 p-4 rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about Bible verses, theology, study plans, or biblical topics..."
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 self-end"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold text-blue-900 mb-1">Commentary</h4>
              <p className="text-xs text-blue-700">Deep verse explanations</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold text-green-900 mb-1">Study Plans</h4>
              <p className="text-xs text-green-700">Personalized reading</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold text-purple-900 mb-1">Theology</h4>
              <p className="text-xs text-purple-700">Biblical answers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <h4 className="font-semibold text-amber-900 mb-1">Summaries</h4>
              <p className="text-xs text-amber-700">Complex topics simplified</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}