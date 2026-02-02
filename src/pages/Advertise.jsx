import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Globe, Mail, 
  CheckCircle, DollarSign, BarChart3, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function Advertise() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    budget: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: 'GoodGodMusics@gmail.com',
        subject: `New Advertising Inquiry from ${formData.name}`,
        body: `
          Name: ${formData.name}
          Email: ${formData.email}
          Company: ${formData.company}
          Budget: ${formData.budget}
          
          Message:
          ${formData.message}
        `
      });

      toast.success('Inquiry sent! We\'ll contact you soon.');
      setFormData({ name: '', email: '', company: '', budget: '', message: '' });
    } catch (error) {
      toast.error('Failed to send inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Advertise With Us
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
              Reach a faith-driven audience through Bible Harmony's platform connecting 
              scripture, music, and community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-stone-800 mb-1">10K+</p>
              <p className="text-sm text-stone-500">Monthly Visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-stone-800 mb-1">1,189</p>
              <p className="text-sm text-stone-500">Bible Chapters</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-stone-800 mb-1">Faith-Based</p>
              <p className="text-sm text-stone-500">Target Audience</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-stone-800 mb-1">Global</p>
              <p className="text-sm text-stone-500">Reach</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 px-4 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-stone-800 mb-12">
            Our Audience
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Faith Seekers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600">
                  Christians exploring scripture through music, daily devotionals, and AI-assisted study tools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Christian Artists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600">
                  Musicians, producers, and worship leaders submitting original faith-based content for collaboration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Church Communities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600">
                  Pastors, ministry leaders, and church groups using our platform for worship and events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ad Placements */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-center text-stone-800 mb-4">
          Premium Ad Placements
        </h2>
        <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
          Strategic, non-intrusive placements designed to blend seamlessly with our spiritual content.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Banners</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>300x250 Medium Rectangle on Music & Playlist pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>160x600 Wide Skyscraper for extended visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Perfect for ministry services, Christian books, or faith products</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Banners</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>728x90 Leaderboard across all pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>High visibility without disrupting content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Ideal for events, conferences, or courses</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Below-content placements after chapter readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Between-section ads on timeline and forums</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Native look and feel with brand-consistent design</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>320x50 Mobile banner for on-the-go users</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Responsive designs for all screen sizes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Fast loading to preserve user experience</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-50/30 to-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-stone-800 mb-4">
            Advertising Guidelines
          </h2>
          <p className="text-center text-stone-600 mb-8">
            We maintain high standards to preserve our platform's spiritual integrity.
          </p>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-stone-800 mb-1">Christian Values</h4>
                    <p className="text-sm text-stone-600">All ads must align with biblical principles and Christian ethics.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-stone-800 mb-1">Quality Content</h4>
                    <p className="text-sm text-stone-600">Professional, high-resolution creatives that enhance user experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-stone-800 mb-1">Relevant Offerings</h4>
                    <p className="text-sm text-stone-600">Products, services, or events that serve our faith community.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-stone-800 mb-1">Non-Intrusive</h4>
                    <p className="text-sm text-stone-600">No pop-ups, autoplay audio, or disruptive formats.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Get Started</CardTitle>
            <p className="text-center text-stone-600">
              Fill out the form below and we'll send you our media kit and pricing details.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Company/Ministry</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Monthly Budget</Label>
                  <Input
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="e.g., $500-1000"
                  />
                </div>
              </div>

              <div>
                <Label>Tell Us About Your Goals</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  placeholder="What are you looking to promote? Who is your target audience?"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? 'Sending...' : 'Request Media Kit'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-stone-600 mb-2">Questions? Contact us directly:</p>
          <a 
            href="mailto:GoodGodMusics@gmail.com" 
            className="text-amber-700 font-semibold hover:underline flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            GoodGodMusics@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}