import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Heart, ExternalLink, ShoppingCart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

export default function CharityStore() {
  const [currentUser, setCurrentUser] = useState(null);
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

  const { data: charityPartners = [] } = useQuery({
    queryKey: ['charityPartners'],
    queryFn: () => base44.entities.CharityPartner.filter({ is_active: true }, 'points_cost')
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ['myCharityPurchases', currentUser?.email],
    queryFn: () => {
      if (!currentUser) return [];
      return base44.entities.CharityPurchase.filter({ user_email: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser
  });

  const purchaseMutation = useMutation({
    mutationFn: async (partner) => {
      if (!currentUser) throw new Error('Please log in');
      if ((currentUser.prayer_points || 0) < partner.points_cost) {
        throw new Error('Not enough prayer points');
      }

      // Create purchase record
      await base44.entities.CharityPurchase.create({
        user_email: currentUser.email,
        charity_partner_id: partner.id,
        charity_name: partner.name,
        bundle_name: partner.bundle_name,
        points_spent: partner.points_cost,
        impact_description: partner.impact_description
      });

      // Deduct points
      await base44.auth.updateMe({
        prayer_points: (currentUser.prayer_points || 0) - partner.points_cost
      });

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCharityPurchases'] });
      // Reload user to get updated points
      base44.auth.me().then(user => setCurrentUser(user));
    },
    onError: (error) => {
      alert(error.message || 'Failed to complete donation');
    }
  });

  const userPoints = currentUser?.prayer_points || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4"
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-stone-800 mb-2">Charity Store</h2>
        <p className="text-stone-600">Turn your prayer points into real-world impact</p>
        
        {currentUser && (
          <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300">
            <Award className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-xl text-amber-800">{userPoints}</span>
            <span className="text-sm text-amber-700">Prayer Points</span>
          </div>
        )}
      </div>

      {!currentUser && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <p className="text-stone-700">Please log in to use the Charity Store</p>
          </CardContent>
        </Card>
      )}

      {/* Charity Partners */}
      <div className="grid md:grid-cols-2 gap-6">
        {charityPartners.map((partner) => {
          const canAfford = userPoints >= partner.points_cost;
          return (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`h-full ${canAfford ? 'border-green-200' : 'border-stone-200'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {partner.logo_url && (
                        <img src={partner.logo_url} alt={partner.name} className="h-12 mb-3" />
                      )}
                      <CardTitle className="text-xl">{partner.name}</CardTitle>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 text-lg px-3 py-1">
                      {partner.points_cost} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-stone-600 text-sm">{partner.description}</p>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-purple-900 text-sm mb-1">
                          {partner.bundle_name}
                        </p>
                        <p className="text-purple-700 text-xs">{partner.impact_description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => purchaseMutation.mutate(partner)}
                      disabled={!currentUser || !canAfford || purchaseMutation.isPending}
                      className={`flex-1 ${canAfford ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-400'}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {canAfford ? 'Donate Now' : 'Earn More Points'}
                    </Button>
                    {partner.website && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(partner.website, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {charityPartners.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-stone-500">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No charity partners available yet. Check back soon!</p>
          </CardContent>
        </Card>
      )}

      {/* My Donations */}
      {myPurchases.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-stone-800 mb-4">Your Impact</h3>
          <div className="space-y-3">
            {myPurchases.map((purchase) => (
              <Card key={purchase.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">{purchase.charity_name}</p>
                      <p className="text-sm text-stone-600">{purchase.bundle_name}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(purchase.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {purchase.points_spent} pts
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}