import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Zap, BookOpen, Star } from 'lucide-react';

const badgeIcons = {
  quiz_off_winner: Trophy,
  perfect_score: Star,
  speed_demon: Zap,
  bible_scholar: BookOpen,
  quiz_master: Award
};

const rarityColors = {
  common: 'bg-stone-100 text-stone-700 border-stone-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-amber-100 text-amber-700 border-amber-300'
};

export default function BadgeDisplay({ user, compact = false }) {
  const queryClient = useQueryClient();

  const { data: badges = [] } = useQuery({
    queryKey: ['badges', user?.email],
    queryFn: () => base44.entities.Badge.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const toggleDisplayMutation = useMutation({
    mutationFn: async ({ id, isDisplayed }) => {
      return base44.entities.Badge.update(id, { is_displayed: isDisplayed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    }
  });

  const displayedBadges = badges.filter(b => b.is_displayed);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayedBadges.slice(0, 3).map(badge => {
          const Icon = badgeIcons[badge.badge_type] || Trophy;
          return (
            <div
              key={badge.id}
              className={`px-3 py-1 rounded-full border-2 flex items-center gap-2 ${rarityColors[badge.rarity]}`}
              title={badge.badge_description}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{badge.badge_name}</span>
            </div>
          );
        })}
        {displayedBadges.length > 3 && (
          <div className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 border-2 border-stone-300">
            <span className="text-xs font-medium">+{displayedBadges.length - 3}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          Earned Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-center text-stone-500 py-8">
            No badges earned yet. Complete quizzes and challenges to earn badges!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {badges.map(badge => {
              const Icon = badgeIcons[badge.badge_type] || Trophy;
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 ${rarityColors[badge.rarity]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="w-8 h-8" />
                    <Badge variant="outline" className="text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                  <h3 className="font-bold mb-1">{badge.badge_name}</h3>
                  <p className="text-xs mb-3">{badge.badge_description}</p>
                  <Button
                    size="sm"
                    variant={badge.is_displayed ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => toggleDisplayMutation.mutate({ 
                      id: badge.id, 
                      isDisplayed: !badge.is_displayed 
                    })}
                  >
                    {badge.is_displayed ? 'Displayed on Profile' : 'Display on Profile'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}