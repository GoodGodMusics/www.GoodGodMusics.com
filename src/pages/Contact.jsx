import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, MessageSquare, Send, MapPin, Clock, 
  Phone, Loader2, Check, Heart
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: formData.email,
      subject: `Thank you for contacting Bible Harmony`,
      body: `Dear ${formData.name},\n\nThank you for reaching out to Bible Harmony. We have received your message regarding "${formData.subject}" and will get back to you as soon as possible.\n\nYour message:\n${formData.message}\n\nBlessings,\nThe Bible Harmony Team`
    });

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'support@bibleharmony.com',
      description: 'We typically respond within 24 hours'
    },
    {
      icon: Clock,
      title: 'Response Time',
      detail: '24-48 Hours',
      description: 'Monday through Friday'
    },
    {
      icon: Heart,
      title: 'Community',
      detail: 'Join Our Fellowship',
      description: 'Connect with other believers'
    }
  ];

  const subjects = [
    'General Inquiry',
    'Song Suggestion',
    'Technical Issue',
    'Partnership Opportunity',
    'Store Order Issue',
    'Prayer Request',
    'Other'
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-4">
            Message Sent!
          </h1>
          <p className="text-stone-600 mb-6">
            Thank you for reaching out. We've sent a confirmation to {formData.email} 
            and will get back to you soon.
          </p>
          <Button 
            onClick={() => {
              setIsSuccess(false);
              setFormData({ name: '', email: '', subject: '', message: '' });
            }}
            className="bg-amber-600 hover:bg-amber-700 rounded-xl"
          >
            Send Another Message
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              Have a question, suggestion, or just want to say hello? 
              We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-stone-900/5 text-center hover:shadow-2xl transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                    <info.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">{info.title}</h3>
                  <p className="text-amber-700 font-medium mb-1">{info.detail}</p>
                  <p className="text-stone-500 text-sm">{info.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-stone-800 to-stone-700 p-8 text-center">
              <h2 className="text-2xl font-serif font-bold text-white">Send Us a Message</h2>
              <p className="text-stone-300 mt-2">Fill out the form below and we'll get back to you soon</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-stone-700">Your Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="mt-2 border-stone-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <Label className="text-stone-700">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="mt-2 border-stone-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <Label className="text-stone-700">Subject *</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData({...formData, subject: value})}
                >
                  <SelectTrigger className="mt-2 border-stone-200 focus:border-amber-400 focus:ring-amber-400">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-stone-700">Your Message *</Label>
                <Textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us what's on your heart..."
                  className="mt-2 min-h-[150px] border-stone-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-6 rounded-xl text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4">
            Common Questions
          </h2>
          <p className="text-stone-600 mb-8">
            Before reaching out, you might find your answer in our frequently asked questions.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              {
                q: 'How are songs selected for each chapter?',
                a: 'Our team carefully curates songs that thematically match the content, emotion, and message of each biblical chapter.'
              },
              {
                q: 'Can I suggest a song for a specific chapter?',
                a: 'Absolutely! Use the "Suggest Song" button on any chapter page to submit your recommendation for review.'
              },
              {
                q: 'How do I track my store order?',
                a: 'Once your order ships, you\'ll receive an email with tracking information. You can also contact us for updates.'
              },
              {
                q: 'Is Bible Harmony affiliated with any denomination?',
                a: 'No, we\'re a non-denominational platform focused on connecting all believers with Scripture through music.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <h3 className="font-bold text-stone-800 mb-2">{faq.q}</h3>
                <p className="text-stone-600 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}