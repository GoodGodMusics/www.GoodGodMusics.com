import React, { useState } from 'react';
import { MapPin, Navigation, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const biblicalJourneys = {
  exodus: {
    name: "The Exodus Journey",
    description: "Moses leads Israel from Egypt to the Promised Land",
    locations: [
      { name: "Egypt (Rameses)", lat: 30.5, lng: 31.2, event: "Departure from slavery" },
      { name: "Red Sea Crossing", lat: 29.5, lng: 32.9, event: "Miraculous crossing" },
      { name: "Mount Sinai", lat: 28.5, lng: 33.9, event: "Receiving the Ten Commandments" },
      { name: "Kadesh Barnea", lat: 30.7, lng: 34.4, event: "40 years of wilderness wandering begins" },
      { name: "Jordan River", lat: 31.8, lng: 35.5, event: "Entry into Promised Land" }
    ],
    color: "#D97706"
  },
  abraham: {
    name: "Abraham's Journey",
    description: "From Ur to Canaan - The Father of Faith",
    locations: [
      { name: "Ur of the Chaldeans", lat: 30.9, lng: 46.1, event: "Abraham's birthplace" },
      { name: "Haran", lat: 36.9, lng: 39.0, event: "Temporary settlement" },
      { name: "Canaan (Shechem)", lat: 32.2, lng: 35.3, event: "God's promise of the land" },
      { name: "Egypt", lat: 30.0, lng: 31.2, event: "Famine refuge" },
      { name: "Hebron", lat: 31.5, lng: 35.1, event: "Final settlement" }
    ],
    color: "#059669"
  },
  paul: {
    name: "Paul's Missionary Journeys",
    description: "Spreading the Gospel across the Roman Empire",
    locations: [
      { name: "Jerusalem", lat: 31.8, lng: 35.2, event: "Starting point" },
      { name: "Antioch", lat: 36.2, lng: 36.2, event: "Missionary base" },
      { name: "Ephesus", lat: 37.9, lng: 27.3, event: "Major church planted" },
      { name: "Athens", lat: 37.9, lng: 23.7, event: "Mars Hill sermon" },
      { name: "Corinth", lat: 37.9, lng: 22.9, event: "Church establishment" },
      { name: "Rome", lat: 41.9, lng: 12.5, event: "Final destination" }
    ],
    color: "#7C3AED"
  }
};

export default function BiblicalMapViewer() {
  const [selectedJourney, setSelectedJourney] = useState('exodus');
  const journey = biblicalJourneys[selectedJourney];

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-stone-100 border-2 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-800">
          <MapPin className="w-6 h-6" />
          Biblical Journeys Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedJourney} onValueChange={setSelectedJourney}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="exodus">Exodus</TabsTrigger>
            <TabsTrigger value="abraham">Abraham</TabsTrigger>
            <TabsTrigger value="paul">Paul's Travels</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedJourney} className="space-y-4">
            {/* Journey Title */}
            <div className="text-center py-4">
              <h3 className="text-xl font-bold text-stone-800">{journey.name}</h3>
              <p className="text-stone-600 text-sm">{journey.description}</p>
            </div>

            {/* Visual Map Representation */}
            <div className="bg-white rounded-lg p-6 border-2 border-stone-300 relative overflow-hidden min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-amber-50 opacity-30" />
              
              {/* Journey Path */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <defs>
                  <marker
                    id={`arrowhead-${selectedJourney}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill={journey.color} />
                  </marker>
                </defs>
                {journey.locations.map((loc, idx) => {
                  if (idx === journey.locations.length - 1) return null;
                  const nextLoc = journey.locations[idx + 1];
                  
                  // Simple coordinate mapping (normalized to SVG viewport)
                  const x1 = ((loc.lng + 180) / 360) * 100;
                  const y1 = ((90 - loc.lat) / 180) * 100;
                  const x2 = ((nextLoc.lng + 180) / 360) * 100;
                  const y2 = ((90 - nextLoc.lat) / 180) * 100;
                  
                  return (
                    <line
                      key={idx}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={journey.color}
                      strokeWidth="3"
                      strokeDasharray="5,5"
                      markerEnd={`url(#arrowhead-${selectedJourney})`}
                      opacity="0.6"
                    />
                  );
                })}
              </svg>

              {/* Location Markers */}
              {journey.locations.map((location, idx) => {
                const x = ((location.lng + 180) / 360) * 100;
                const y = ((90 - location.lat) / 180) * 100;
                
                return (
                  <div
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                      zIndex: 10
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: journey.color }}
                    />
                    <div className="absolute left-8 top-0 bg-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border-2 border-stone-200 z-20">
                      <p className="font-bold text-sm text-stone-800">{location.name}</p>
                      <p className="text-xs text-stone-600">{location.event}</p>
                      <p className="text-xs text-amber-600 font-semibold">Stop {idx + 1}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Location Timeline */}
            <div className="space-y-2">
              <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Journey Timeline
              </h4>
              {journey.locations.map((location, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-stone-200 hover:border-amber-400 transition-colors">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: journey.color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-stone-800">{location.name}</h5>
                    <p className="text-sm text-stone-600">{location.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}