import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product, onAddToCart }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const categoryColors = {
    'Apparel': 'from-blue-500 to-indigo-600',
    'Accessories': 'from-purple-500 to-pink-600',
    'Supplements': 'from-green-500 to-emerald-600',
    'Books': 'from-amber-500 to-orange-600',
    'Music': 'from-red-500 to-rose-600'
  };

  return (
    <motion.div
      className="group relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-stone-900/5 border border-stone-100">
        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={`bg-gradient-to-r ${categoryColors[product.category]} text-white border-0`}>
            {product.category}
          </Badge>
        </div>

        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
          {product.image_url ? (
            <motion.img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.6 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${categoryColors[product.category]} opacity-20`} />
            </div>
          )}
          
          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-6"
          >
            <Button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`
                ${isAdded 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-white text-stone-900 hover:bg-amber-50'
                }
                px-6 py-2 rounded-full shadow-xl transition-all duration-300
              `}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h3 className="font-serif text-lg font-bold text-stone-800 mb-1 line-clamp-1">
            {product.name}
          </h3>
          
          {product.biblical_inspiration && (
            <p className="text-xs text-amber-700/70 italic mb-2 line-clamp-1">
              "{product.biblical_inspiration}"
            </p>
          )}
          
          <p className="text-stone-500 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-stone-800">
                ${product.price?.toFixed(2)}
              </span>
            </div>

            {product.stock_quantity !== undefined && product.stock_quantity < 10 && (
              <span className="text-xs text-red-600 font-medium">
                Only {product.stock_quantity} left
              </span>
            )}
          </div>
        </div>

        {/* Quick add button for mobile */}
        <div className="md:hidden px-6 pb-6">
          <Button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`
              w-full
              ${isAdded 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
              }
              text-white rounded-xl py-3
            `}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Added to Cart!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}