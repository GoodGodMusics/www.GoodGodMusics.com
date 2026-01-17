import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, ShoppingBag, Loader2, 
  Sparkles, Grid3X3, LayoutList, SlidersHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/store/ProductCard';

export default function Store() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product) => {
      const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
      localStorage.setItem('sessionId', sessionId);
      
      // Check if item already in cart
      const existingItems = await base44.entities.CartItem.filter({ 
        session_id: sessionId,
        product_id: product.id 
      });
      
      if (existingItems.length > 0) {
        // Update quantity
        await base44.entities.CartItem.update(existingItems[0].id, {
          quantity: existingItems[0].quantity + 1
        });
      } else {
        // Add new item
        await base44.entities.CartItem.create({
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          image_url: product.image_url,
          session_id: sessionId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const categories = ['all', 'Apparel', 'Accessories', 'Supplements', 'Books', 'Music'];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case 'featured':
      default:
        result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const categoryCount = useMemo(() => {
    const counts = { all: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Faith Store
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              Discover faith-inspired merchandise, supplements, and more.
              Every purchase supports our mission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-30 bg-white/95 backdrop-blur-lg border-b border-stone-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-3 rounded-full border-stone-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 rounded-full transition-all ${
                      selectedCategory === category
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-0'
                        : 'border-stone-200 hover:border-amber-400'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All' : category}
                    <span className="ml-1 opacity-60">({categoryCount[category] || 0})</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 rounded-full">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="hidden sm:flex items-center border border-stone-200 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'grid' ? 'bg-amber-100 text-amber-700' : 'text-stone-400'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-stone-400'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
            <p className="text-stone-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">No Products Found</h3>
            <p className="text-stone-500 mb-6">
              {products.length === 0 
                ? "Products haven't been added yet. Check back soon!" 
                : "Try adjusting your search or filters."}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-stone-500">
                Showing <span className="font-medium text-stone-800">{filteredProducts.length}</span> products
              </p>
            </div>

            <motion.div 
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}
              layout
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <ProductCard 
                    product={product} 
                    onAddToCart={() => addToCartMutation.mutate(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 text-center mb-12">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.filter(c => c !== 'all').map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCategory(category)}
                className={`
                  p-6 rounded-2xl text-center transition-all duration-300
                  ${selectedCategory === category 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' 
                    : 'bg-white hover:bg-amber-50 text-stone-800 shadow-md'
                  }
                `}
              >
                <Sparkles className={`w-8 h-8 mx-auto mb-3 ${
                  selectedCategory === category ? 'text-white' : 'text-amber-600'
                }`} />
                <span className="font-medium">{category}</span>
                <span className={`block text-sm mt-1 ${
                  selectedCategory === category ? 'text-white/80' : 'text-stone-500'
                }`}>
                  {categoryCount[category] || 0} items
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}