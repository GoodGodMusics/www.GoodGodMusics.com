import React, { useState } from 'react';
import { Sparkles, CheckCircle, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const prophecies = [
  {
    prophecy: "Messiah born in Bethlehem",
    oldTestament: "Micah 5:2",
    otDate: "~700 BC",
    fulfillment: "Jesus born in Bethlehem",
    newTestament: "Matthew 2:1",
    ntDate: "~4 BC",
    fulfilled: true
  },
  {
    prophecy: "Born of a virgin",
    oldTestament: "Isaiah 7:14",
    otDate: "~700 BC",
    fulfillment: "Virgin Mary conceives Jesus",
    newTestament: "Matthew 1:18-23",
    ntDate: "~4 BC",
    fulfilled: true
  },
  {
    prophecy: "From the line of David",
    oldTestament: "Jeremiah 23:5",
    otDate: "~600 BC",
    fulfillment: "Jesus descended from David",
    newTestament: "Luke 3:23-31",
    ntDate: "~4 BC",
    fulfilled: true
  },
  {
    prophecy: "Betrayed for 30 silver pieces",
    oldTestament: "Zechariah 11:12-13",
    otDate: "~520 BC",
    fulfillment: "Judas betrays Jesus",
    newTestament: "Matthew 26:14-15",
    ntDate: "~30 AD",
    fulfilled: true
  },
  {
    prophecy: "Crucified with criminals",
    oldTestament: "Isaiah 53:12",
    otDate: "~700 BC",
    fulfillment: "Crucified between two thieves",
    newTestament: "Mark 15:27-28",
    ntDate: "~30 AD",
    fulfilled: true
  },
  {
    prophecy: "Hands and feet pierced",
    oldTestament: "Psalm 22:16",
    otDate: "~1000 BC",
    fulfillment: "Crucifixion - nails piercing",
    newTestament: "John 20:25-27",
    ntDate: "~30 AD",
    fulfilled: true
  },
  {
    prophecy: "Resurrection from the dead",
    oldTestament: "Psalm 16:10",
    otDate: "~1000 BC",
    fulfillment: "Jesus rises on third day",
    newTestament: "Acts 2:31-32",
    ntDate: "~30 AD",
    fulfilled: true
  },
  {
    prophecy: "Return of Christ",
    oldTestament: "Zechariah 14:4",
    otDate: "~520 BC",
    fulfillment: "Second Coming - Future",
    newTestament: "Acts 1:11, Revelation 19",
    ntDate: "Future",
    fulfilled: false
  },
  {
    prophecy: "New Heaven and New Earth",
    oldTestament: "Isaiah 65:17",
    otDate: "~700 BC",
    fulfillment: "Eternal Kingdom - Future",
    newTestament: "Revelation 21:1-4",
    ntDate: "Future",
    fulfilled: false
  }
];

export default function ProphecyTimeline() {
  const [selectedProphecy, setSelectedProphecy] = useState(null);
  const fulfilledCount = prophecies.filter(p => p.fulfilled).length;
  const totalCount = prophecies.length;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-purple-800">
          <Sparkles className="w-6 h-6" />
          Messianic Prophecies Timeline
        </CardTitle>
        <p className="text-sm text-stone-600 mt-2">
          Prophecies about the Messiah - Written centuries before Jesus, fulfilled perfectly
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-green-600">{fulfilledCount} Fulfilled</Badge>
          <Badge className="bg-amber-600">{totalCount - fulfilledCount} Future</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Timeline */}
        <div className="relative bg-white rounded-lg p-6 border-2 border-stone-300 overflow-x-auto">
          <div className="flex items-center justify-between mb-4 text-xs text-stone-600 font-semibold">
            <span>1000 BC</span>
            <span>700 BC</span>
            <span>Birth of Christ</span>
            <span>Crucifixion</span>
            <span>Future</span>
          </div>
          
          {/* Timeline bar */}
          <div className="relative h-2 bg-gradient-to-r from-purple-300 via-blue-400 to-green-400 rounded-full mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full" />
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full" />
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
            <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-600 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Prophecy Cards */}
        <div className="grid gap-4">
          {prophecies.map((p, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedProphecy(selectedProphecy === idx ? null : idx)}
              className={`
                bg-white rounded-lg p-4 border-2 cursor-pointer transition-all
                ${p.fulfilled ? 'border-green-300 hover:border-green-500' : 'border-amber-300 hover:border-amber-500'}
                ${selectedProphecy === idx ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${p.fulfilled ? 'text-green-600' : 'text-amber-600'}`}>
                  {p.fulfilled ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    {p.prophecy}
                    {idx < 3 && <Star className="w-4 h-4 text-yellow-500" />}
                  </h3>
                  
                  <div className="mt-2 grid md:grid-cols-2 gap-4">
                    {/* Prophecy */}
                    <div className="bg-purple-50 rounded p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 mb-1">Prophecy</p>
                      <p className="text-sm text-stone-700 font-mono">{p.oldTestament}</p>
                      <p className="text-xs text-stone-500 mt-1">{p.otDate}</p>
                    </div>
                    
                    {/* Fulfillment */}
                    <div className={`rounded p-3 border ${p.fulfilled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className={`text-xs font-semibold mb-1 ${p.fulfilled ? 'text-green-700' : 'text-amber-700'}`}>
                        {p.fulfilled ? 'Fulfilled' : 'Future'}
                      </p>
                      <p className="text-sm text-stone-700">{p.fulfillment}</p>
                      <p className="text-sm text-stone-700 font-mono mt-1">{p.newTestament}</p>
                      <p className="text-xs text-stone-500 mt-1">{p.ntDate}</p>
                    </div>
                  </div>

                  {selectedProphecy === idx && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-stone-700">
                        <strong>Time Gap:</strong> This prophecy was written approximately{' '}
                        {p.fulfilled 
                          ? `${parseInt(p.otDate.replace(/[^\d]/g, '')) - (p.ntDate.includes('BC') ? parseInt(p.ntDate.replace(/[^\d]/g, '')) : -parseInt(p.ntDate.replace(/[^\d]/g, '')))} years`
                          : 'over 2,700 years ago'
                        } before its {p.fulfilled ? 'fulfillment' : 'expected fulfillment'}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300">
          <p className="text-sm text-stone-700 text-center">
            <strong className="text-purple-800">Amazing Accuracy:</strong> Over 300 specific prophecies about the Messiah in the Old Testament were fulfilled by Jesus Christ. The mathematical probability of one person fulfilling just 48 prophecies is 1 in 10¹⁵⁷!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}