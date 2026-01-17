import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookOpen, Music2, Heart, Users, Star, 
  Target, Lightbulb, Globe, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/branding/Logo';

export default function About() {
  const values = [
    {
      icon: BookOpen,
      title: 'Scripture-Centered',
      description: 'Every song selection is carefully chosen to enhance understanding and appreciation of biblical text.'
    },
    {
      icon: Music2,
      title: 'Musical Excellence',
      description: 'We curate only the highest quality worship music that honors God and moves hearts.'
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'Our platform grows through the contributions and suggestions of our faithful community.'
    },
    {
      icon: Globe,
      title: 'Accessible to All',
      description: 'Making the Word of God and inspiring music available to everyone, everywhere.'
    }
  ];

  const team = [
    {
      name: 'GoodGodMusics',
      role: 'Founder & Curator',
      bio: 'Passionate about combining scripture and song to create meaningful worship experiences.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-amber-400 text-sm tracking-[0.4em] uppercase font-light">Our Story</span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mt-4 mb-6">
              About Bible Harmony
            </h1>
            <p className="text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto">
              Where ancient wisdom meets modern worship. We believe that music has 
              the power to deepen our connection to Scripture and transform our 
              spiritual journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-amber-100 rounded-full opacity-50" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-200 rounded-full opacity-30" />
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=500&fit=crop"
                    alt="Open Bible with light"
                    className="w-full h-80 object-cover"
                  />
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-8 h-8 text-amber-600" />
                      <h3 className="text-2xl font-serif font-bold text-stone-800">Our Mission</h3>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      To create a comprehensive resource that pairs every chapter of the Bible 
                      with carefully selected music, helping believers worldwide experience 
                      Scripture in a deeper, more meaningful way.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-6">
                  Why Bible Harmony?
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed mb-6">
                  We recognized that while there are countless worship songs and biblical 
                  resources available, there was no comprehensive platform connecting 
                  specific Scripture passages with thematically appropriate music.
                </p>
                <p className="text-lg text-stone-600 leading-relaxed">
                  Bible Harmony fills this gap by providing a chronological journey through 
                  the entire Bible, with each chapter thoughtfully paired with music that 
                  enhances understanding and emotional connection to God's Word.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">1,189 Chapters</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
                  <Music2 className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">Curated Music</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
                  <Heart className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">Community Driven</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-amber-700 text-sm tracking-[0.3em] uppercase font-light">What We Believe</span>
            <h2 className="text-4xl font-serif font-bold text-stone-800 mt-4">Our Core Values</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-stone-900/5 h-full hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-800 mb-3">{value.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <Lightbulb className="w-16 h-16 text-amber-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                Our Vision
              </h2>
              <p className="text-xl text-stone-300 leading-relaxed">
                To become the world's most comprehensive and beloved resource for 
                experiencing Scripture through music, touching hearts and transforming 
                lives across every nation and generation.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-stone-50">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-amber-700 text-sm tracking-[0.3em] uppercase font-light">The Heart Behind</span>
            <h2 className="text-4xl font-serif font-bold text-stone-800 mt-4">Meet the Founder</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-6 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="md:flex">
              <div className="md:w-1/3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
                  alt="Founder"
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-2/3 p-8 md:p-12">
                <div className="flex items-center gap-2 mb-2">
                  <Logo size="small" showText={false} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-800 mb-1">GoodGodMusics</h3>
                <p className="text-amber-700 mb-6">Founder & Curator</p>
                <p className="text-stone-600 leading-relaxed mb-6">
                  With a deep love for Scripture and a passion for worship music, GoodGodMusics 
                  founded Bible Harmony to share the transformative experience of connecting 
                  God's Word with inspiring melodies. The vision is simple yet profound: help 
                  believers around the world encounter Scripture in a fresh, musical way.
                </p>
                <p className="text-stone-600 leading-relaxed">
                  "Music has always been a gateway to deeper spiritual experiences for me. 
                  When I read Scripture accompanied by the right song, the words come alive 
                  in ways I never expected. I created Bible Harmony to share that gift with others."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
            Explore the Bible like never before. Discover how music can transform 
            your understanding and connection to God's Word.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('BibleTimeline')}>
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 rounded-full px-8">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Bible Timeline
              </Button>
            </Link>
            <Link to={createPageUrl('Contact')}>
              <Button size="lg" variant="outline" className="border-amber-600 text-amber-800 hover:bg-amber-50 rounded-full px-8">
                Get in Touch
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}