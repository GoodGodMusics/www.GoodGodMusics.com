import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, ExternalLink, Youtube, BookOpen, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function EventBoard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const queryClient = useQueryClient();

  const [newEvent, setNewEvent] = useState({
    event_title: '',
    event_type: 'worship_service',
    church_name: '',
    denomination: 'Catholic',
    location: '',
    event_date: '',
    event_time: '',
    description: '',
    is_recurring: false,
    recurrence_pattern: '',
    social_media_links: {},
    max_attendees: null
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ['localEvents'],
    queryFn: () => base44.entities.LocalEvent.filter({ is_approved: true }, '-event_date', 100)
  });

  const { data: myRSVPs = [] } = useQuery({
    queryKey: ['myRSVPs', currentUser?.email],
    queryFn: () => {
      if (!currentUser) return [];
      return base44.entities.EventRSVP.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this faith event: "${eventData.event_title}" (${eventData.event_type}), suggest 3-5 practical resources like relevant books, craft ideas, scripture passages, or group activities that would enhance this event. Return as a simple array of strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            resources: { type: "array", items: { type: "string" } }
          }
        }
      });

      return base44.entities.LocalEvent.create({
        ...eventData,
        organizer_email: currentUser.email,
        organizer_name: currentUser.full_name,
        suggested_resources: suggestions.resources || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localEvents'] });
      setShowCreateForm(false);
      setNewEvent({
        event_title: '',
        event_type: 'worship_service',
        church_name: '',
        denomination: 'Catholic',
        location: '',
        event_date: '',
        event_time: '',
        description: '',
        is_recurring: false,
        social_media_links: {},
        max_attendees: null
      });
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId }) => {
      const existing = myRSVPs.find(r => r.event_id === eventId);
      if (existing) {
        await base44.entities.EventRSVP.delete(existing.id);
        const event = events.find(e => e.id === eventId);
        await base44.entities.LocalEvent.update(eventId, {
          rsvp_count: Math.max(0, (event.rsvp_count || 0) - 1)
        });
      } else {
        await base44.entities.EventRSVP.create({
          event_id: eventId,
          user_email: currentUser.email,
          user_name: currentUser.full_name,
          status: 'attending'
        });
        const event = events.find(e => e.id === eventId);
        await base44.entities.LocalEvent.update(eventId, {
          rsvp_count: (event.rsvp_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myRSVPs'] });
    }
  });

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesSearch = !searchQuery || 
      event.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.church_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const isRSVPd = (eventId) => myRSVPs.some(r => r.event_id === eventId);

  const eventTypeColors = {
    mass: 'bg-purple-100 text-purple-800',
    worship_service: 'bg-blue-100 text-blue-800',
    bible_study: 'bg-green-100 text-green-800',
    prayer_meeting: 'bg-amber-100 text-amber-800',
    community_outreach: 'bg-pink-100 text-pink-800',
    book_reading: 'bg-indigo-100 text-indigo-800',
    craft_workshop: 'bg-orange-100 text-orange-800',
    youth_group: 'bg-teal-100 text-teal-800',
    other: 'bg-stone-100 text-stone-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-stone-800">Local Faith Events</h2>
        {currentUser && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search events, churches, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="mass">Mass</SelectItem>
            <SelectItem value="worship_service">Worship Service</SelectItem>
            <SelectItem value="bible_study">Bible Study</SelectItem>
            <SelectItem value="prayer_meeting">Prayer Meeting</SelectItem>
            <SelectItem value="community_outreach">Community Outreach</SelectItem>
            <SelectItem value="book_reading">Book Reading</SelectItem>
            <SelectItem value="craft_workshop">Craft Workshop</SelectItem>
            <SelectItem value="youth_group">Youth Group</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showCreateForm && currentUser && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createEventMutation.mutate(newEvent); }} className="space-y-4">
              <Input
                placeholder="Event title"
                value={newEvent.event_title}
                onChange={(e) => setNewEvent({...newEvent, event_title: e.target.value})}
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Select value={newEvent.event_type} onValueChange={(val) => setNewEvent({...newEvent, event_type: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mass">Mass</SelectItem>
                    <SelectItem value="worship_service">Worship Service</SelectItem>
                    <SelectItem value="bible_study">Bible Study</SelectItem>
                    <SelectItem value="prayer_meeting">Prayer Meeting</SelectItem>
                    <SelectItem value="community_outreach">Community Outreach</SelectItem>
                    <SelectItem value="book_reading">Book Reading</SelectItem>
                    <SelectItem value="craft_workshop">Craft Workshop</SelectItem>
                    <SelectItem value="youth_group">Youth Group</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newEvent.denomination} onValueChange={(val) => setNewEvent({...newEvent, denomination: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Denomination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Catholic">Catholic</SelectItem>
                    <SelectItem value="Protestant">Protestant</SelectItem>
                    <SelectItem value="Orthodox">Orthodox</SelectItem>
                    <SelectItem value="Non-denominational">Non-denominational</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Church or organization name"
                value={newEvent.church_name}
                onChange={(e) => setNewEvent({...newEvent, church_name: e.target.value})}
              />
              <Input
                placeholder="Location (address or online link)"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                  required
                />
                <Input
                  type="time"
                  value={newEvent.event_time}
                  onChange={(e) => setNewEvent({...newEvent, event_time: e.target.value})}
                />
              </div>
              <Textarea
                placeholder="Event description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows={3}
              />
              <Input
                type="number"
                placeholder="Max attendees (optional)"
                value={newEvent.max_attendees || ''}
                onChange={(e) => setNewEvent({...newEvent, max_attendees: e.target.value ? parseInt(e.target.value) : null})}
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {filteredEvents.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{event.event_title}</CardTitle>
                    <Badge className={eventTypeColors[event.event_type]}>
                      {event.event_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {event.denomination && (
                    <Badge variant="outline">{event.denomination}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.church_name && (
                  <p className="font-semibold text-stone-800">{event.church_name}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.event_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                {event.event_time && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Clock className="w-4 h-4" />
                    {event.event_time}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                {event.description && (
                  <p className="text-sm text-stone-700 line-clamp-2">{event.description}</p>
                )}
                {event.suggested_resources && event.suggested_resources.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Suggested Resources:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {event.suggested_resources.slice(0, 3).map((resource, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{resource}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Users className="w-4 h-4" />
                    {event.rsvp_count || 0} attending
                  </div>
                  {currentUser && (
                    <Button
                      size="sm"
                      variant={isRSVPd(event.id) ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate({ eventId: event.id })}
                      className={isRSVPd(event.id) ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isRSVPd(event.id) ? 'Attending' : 'RSVP'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}