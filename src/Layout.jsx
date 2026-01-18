import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingCart, BookOpen, Home, Store, 
  Info, Mail, ChevronDown, Music2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/branding/Logo';
import CartDrawer from '@/components/store/CartDrawer';
import DonationButton from '@/components/ui-custom/DonationButton';
import MessagingPanel from '@/components/community/MessagingPanel';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
      localStorage.setItem('sessionId', sessionId);
      return base44.entities.CartItem.filter({ session_id: sessionId });
    }
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const item = cartItems.find(i => i.product_id === productId);
      if (item) {
        if (quantity <= 0) {
          await base44.entities.CartItem.delete(item.id);
        } else {
          await base44.entities.CartItem.update(item.id, { quantity });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId) => {
      const item = cartItems.find(i => i.product_id === productId);
      if (item) {
        await base44.entities.CartItem.delete(item.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUserRole(currentUser.role);
      } catch (error) {
        setUserRole(null);
      }
    };
    checkUser();
  }, []);

  const navLinks = [
    { name: 'Home', page: 'Home', icon: Home },
    { name: 'The Book', page: 'TheBook', icon: BookOpen },
    { name: 'Bible Timeline', page: 'BibleTimeline', icon: BookOpen },
    { name: 'AI Study', page: 'BibleStudyAI', icon: BookOpen },
    { name: 'Discover', page: 'Discover', icon: Music2 },
    { name: 'Music', page: 'Music', icon: Music2 },
    { name: 'Forums', page: 'Forums', icon: MessageSquare },
    { name: 'Store', page: 'Store', icon: Store },
    { name: 'About', page: 'About', icon: Info },
    { name: 'Contact', page: 'Contact', icon: Mail },
  ];

  if (userRole === 'admin') {
    navLinks.push({ name: 'Admin', page: 'Admin', icon: ShoppingCart });
  }
  
  if (userRole) {
    navLinks.push({ name: 'Profile', page: 'UserProfile', icon: Home });
  }

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <style>{`
        :root {
          --color-primary: #8B5A2B;
          --color-primary-light: #D4A574;
          --color-primary-dark: #5D3A1A;
          --color-accent: #DAA520;
          --color-background: #FFFBF5;
          --color-text: #3D3A36;
          --color-text-muted: #6B6762;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: var(--color-primary-light) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: var(--color-primary-light);
          border-radius: 3px;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Navigation */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-lg shadow-lg shadow-amber-900/5' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex-shrink-0">
              <Logo size="small" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${currentPageName === link.page 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'text-stone-600 hover:text-amber-800 hover:bg-amber-50'
                    }
                  `}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Donation button */}
              <div className="hidden md:block">
                <DonationButton variant="inline" size="sm" className="text-sm" />
              </div>

              {/* Cart button */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5 text-stone-600" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-lg border-t border-amber-100"
            >
              <div className="px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${currentPageName === link.page 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'text-stone-600 hover:bg-amber-50'
                      }
                    `}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(productId, quantity) => 
          updateCartMutation.mutate({ productId, quantity })
        }
        onRemove={(productId) => removeFromCartMutation.mutate(productId)}
      />

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Floating Donation Button */}
      <DonationButton variant="floating" />

      {/* Messaging Panel */}
      <MessagingPanel />

      {/* Footer */}
      <footer className="bg-gradient-to-b from-stone-800 to-stone-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Logo size="small" />
              <p className="mt-4 text-stone-400 text-sm leading-relaxed">
                Connecting hearts to scripture through the universal language of music.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <a href="#" className="w-10 h-10 rounded-full bg-stone-700 hover:bg-amber-600 flex items-center justify-center transition-colors">
                  <Music2 className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-serif text-lg font-bold mb-4 text-amber-200">Explore</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.page}>
                    <Link 
                      to={createPageUrl(link.page)}
                      className="text-stone-400 hover:text-amber-300 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bible Sections */}
            <div>
              <h3 className="font-serif text-lg font-bold mb-4 text-amber-200">Scripture</h3>
              <ul className="space-y-3 text-sm text-stone-400">
                <li><a href="#" className="hover:text-amber-300 transition-colors">Old Testament</a></li>
                <li><a href="#" className="hover:text-amber-300 transition-colors">New Testament</a></li>
                <li><a href="#" className="hover:text-amber-300 transition-colors">Psalms & Hymns</a></li>
                <li><a href="#" className="hover:text-amber-300 transition-colors">Gospels</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-serif text-lg font-bold mb-4 text-amber-200">Connect</h3>
              <ul className="space-y-3 text-sm text-stone-400">
                <li>
                  <Link to={createPageUrl('Contact')} className="hover:text-amber-300 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li><a href="#" className="hover:text-amber-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-amber-300 transition-colors">Terms of Service</a></li>
              </ul>
              <div className="mt-6">
                <DonationButton variant="inline" size="sm" className="w-full justify-center" />
              </div>
              <p className="text-xs text-stone-500 mt-3">
                Supporting GoodGodMusics Independent Label via DistroKid
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-stone-700 text-center">
            <p className="text-stone-500 text-sm">
              © {new Date().getFullYear()} Bible Harmony by GoodGodMusics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}