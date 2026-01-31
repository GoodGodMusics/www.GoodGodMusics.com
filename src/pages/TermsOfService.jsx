import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold text-stone-800">User Agreement</h1>
              <p className="text-stone-600 mt-1">Effective Date: January 31, 2026</p>
            </div>
          </div>

          <div className="prose prose-stone max-w-none space-y-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-stone-700 leading-relaxed">
                Welcome to Bible Harmony (the "Website" or "Service"), a platform based in Connecticut dedicated to glorifying God through music inspired by Scripture and the teachings of Jesus Christ. Bible Harmony is operated by GoodGodMusics (referred to as "we," "us," or "our").
              </p>
              <p className="text-stone-700 leading-relaxed mt-3">
                By accessing or using the Website, including listening to music, using the AI Jesus bot, accessing the Bible timeline and audio reader, participating in forums, organizing events, submitting music or requests, or creating an account, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the Service.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">1. Description of the Service</h2>
              <p className="text-stone-700 mb-3">Bible Harmony provides:</p>
              <ul className="list-disc pl-6 space-y-2 text-stone-700">
                <li>Streaming and access to modernized songs (1,189 chapters from the Bible in chronological order) created by GoodGodMusics and featured artists.</li>
                <li>Opportunities for Christian artists (professional or upcoming) to submit music for playlists, request to cover songs, or partner on projects (including royalty splits where applicable).</li>
                <li>An AI Jesus bot for compassionate, biblically grounded answers on applying Scripture to modern life.</li>
                <li>A full NIV Bible timeline with audio reader features (for the hearing impaired, drivers, or others).</li>
                <li>Forums, local church event organization, song recommendations/requests, and community features for registered members.</li>
              </ul>
              <p className="text-stone-700 mt-3">
                The Service is provided free of charge to spread the Word of God through music and Scripture. We are a one-stop shop for Jesus-centered content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">2. Eligibility</h2>
              <p className="text-stone-700">
                You must be at least 13 years old to use the Service (or the age of majority in your jurisdiction if higher). If under 18, you must have parental/guardian permission. By using the Service, you represent that you meet these requirements and have the legal capacity to agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">3. User Accounts</h2>
              <p className="text-stone-700">
                To access certain features (e.g., forums, event organization, submissions), you must create an account. You agree to provide accurate information and keep your password secure. You are responsible for all activity under your account. Notify us immediately of unauthorized use. We may suspend or terminate accounts for violations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">4. User-Generated Content and Submissions</h2>
              <p className="text-stone-700 mb-3">
                You may submit music, song requests, recommendations, forum posts, event details, or other content ("User Content"). By submitting, you grant us a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to use, reproduce, modify (for formatting/display), distribute, perform, display, and promote your User Content in connection with operating and promoting the Service and our mission to spread God's Word.
              </p>
              <p className="text-stone-700 mb-3">You represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2 text-stone-700">
                <li>You own or have all necessary rights to your User Content (including music, lyrics, images).</li>
                <li>It does not infringe third-party rights (copyright, trademark, privacy, etc.).</li>
                <li>It complies with these Terms.</li>
              </ul>
              <p className="text-stone-700 mt-3">
                We do not claim ownership of your User Content but may feature it. We reserve the right (but no obligation) to review, remove, or refuse any User Content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">5. Music Submissions, Covers, and Partnerships</h2>
              <p className="text-stone-700">
                We encourage artists to submit music for playlists or request to cover our songs (e.g., chapters copyrighted on albums by GoodGodMusics). Contact us at <a href="mailto:GoodGodMusics@gmail.com" className="text-amber-600 hover:text-amber-700 font-medium">GoodGodMusics@gmail.com</a> for original audio files, lyrics, or to discuss partnerships, including potential royalty splits on collaborative projects. Any partnership requires a separate written agreement. Unauthorized use, reproduction, or distribution of our copyrighted music is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">6. Church and Community Participation</h2>
              <p className="text-stone-700">
                Churches and believers are welcome to use the Service to spread the Gospel through music and Scripture. Organize local events via the app in a manner consistent with biblical values and these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">7. Intellectual Property</h2>
              <p className="text-stone-700">
                All content on the Website (music, audio, Bible text/audio, AI responses, design, trademarks like "Bible Harmony" and "GoodGodMusics") is owned by us or our licensors and protected by copyright and other laws. You may access and use for personal, non-commercial purposes only (e.g., listening, reading, sharing links). No downloading, copying, modifying, distributing, or commercial use without express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">8. Acceptable Use</h2>
              <p className="text-stone-700 mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-stone-700">
                <li>Upload infringing, harmful, abusive, harassing, defamatory, obscene, or illegal content.</li>
                <li>Violate laws, infringe rights, or promote harm.</li>
                <li>Use bots, scrapers, or automated means without permission.</li>
                <li>Interfere with the Service or others' use.</li>
                <li>Misrepresent affiliation with us or misuse the AI Jesus bot for non-biblical advice.</li>
              </ul>
              <p className="text-stone-700 mt-3">
                We may remove content or terminate access for violations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">9. AI Jesus Bot and Bible Features</h2>
              <p className="text-stone-700">
                The AI Jesus bot provides helpful, Scripture-based responses for personal edification. It is not a substitute for pastoral counsel, professional advice, or official doctrine. Use at your own discretion. The NIV Bible timeline and audio reader are for accessibility and convenience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">10. Disclaimers and Limitation of Liability</h2>
              <p className="text-stone-700">
                The Service is provided "as is" without warranties. We disclaim all warranties (express/implied) regarding accuracy, reliability, or fitness for purpose. We are not liable for any indirect, incidental, consequential, or punitive damages arising from use (to the maximum extent permitted by law). Our total liability shall not exceed $100.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">11. Indemnification</h2>
              <p className="text-stone-700">
                You agree to indemnify and hold us harmless from claims arising from your use, User Content, or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">12. Termination</h2>
              <p className="text-stone-700">
                We may terminate or suspend your access at any time for any reason, including violations. Sections surviving termination include intellectual property, disclaimers, indemnification, and governing law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">13. Changes to Terms</h2>
              <p className="text-stone-700">
                We may update these Terms. Continued use constitutes acceptance. Check periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">14. Governing Law</h2>
              <p className="text-stone-700">
                These Terms are governed by Connecticut law (without regard to conflicts of law). Disputes shall be resolved in courts in Connecticut.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">15. Contact Us</h2>
              <p className="text-stone-700 mb-3">
                For questions, partnerships, or concerns, email <a href="mailto:GoodGodMusics@gmail.com" className="text-amber-600 hover:text-amber-700 font-medium">GoodGodMusics@gmail.com</a>. We are one man seeking to fulfill God's vision—your support and prayers are appreciated.
              </p>
              <p className="text-stone-700 font-medium">
                Thank you for joining Bible Harmony in worshiping and sharing Jesus through music and Scripture. God bless you.
              </p>
            </section>

            <div className="mt-12 p-6 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-stone-800 mb-2">Questions or Concerns?</h3>
                  <p className="text-sm text-stone-600">
                    If you have any questions about these Terms of Service, please contact us at{' '}
                    <a href="mailto:GoodGodMusics@gmail.com" className="text-amber-600 hover:text-amber-700 font-medium">
                      GoodGodMusics@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}