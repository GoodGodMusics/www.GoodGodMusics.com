import React, { useState } from 'react';
import { Users, Crown, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const familyTrees = {
  abraham: {
    name: "Abraham's Lineage",
    description: "The Patriarchs - Fathers of the Faith",
    tree: [
      {
        name: "Abraham",
        spouse: "Sarah",
        children: [
          {
            name: "Isaac",
            spouse: "Rebekah",
            note: "Child of promise",
            children: [
              { name: "Esau", note: "Sold birthright" },
              { 
                name: "Jacob (Israel)", 
                spouse: "Rachel & Leah",
                note: "Father of 12 tribes",
                children: [
                  { name: "Reuben" },
                  { name: "Simeon" },
                  { name: "Levi (Priestly line)" },
                  { name: "Judah (Kingly line)" },
                  { name: "Joseph", note: "Dreamer, Egypt" },
                  { name: "Benjamin" },
                  { name: "...and 6 others" }
                ]
              }
            ]
          },
          { name: "Ishmael", note: "Son of Hagar" }
        ]
      }
    ]
  },
  david: {
    name: "David's Royal Line",
    description: "The Line of Kings - Leading to Jesus",
    tree: [
      {
        name: "Jesse",
        children: [
          {
            name: "David",
            spouse: "Bathsheba (& others)",
            note: "Man after God's heart",
            children: [
              {
                name: "Solomon",
                spouse: "Many wives",
                note: "Wisest king",
                children: [
                  { name: "Rehoboam", note: "Kingdom divided" }
                ]
              },
              { name: "Nathan", note: "Ancestor of Mary" }
            ]
          }
        ]
      }
    ]
  },
  jesus: {
    name: "Jesus' Genealogy",
    description: "From Abraham to Christ - Matthew 1",
    tree: [
      { name: "Abraham", note: "Father of nations" },
      { name: "Isaac → Jacob → Judah" },
      { name: "Perez → Hezron → Ram" },
      { name: "Amminadab → Nahshon → Salmon" },
      { name: "Boaz ♥ Ruth", note: "Gentile included" },
      { name: "Obed → Jesse" },
      { name: "David (King)", note: "1000 BC" },
      { name: "Solomon → Rehoboam" },
      { name: "...Kings of Judah..." },
      { name: "Josiah → Jeconiah" },
      { name: "Shealtiel → Zerubbabel", note: "Exile return" },
      { name: "...Descendants..." },
      { name: "Jacob (Joseph's father)" },
      { name: "Joseph ♥ Mary" },
      { name: "JESUS CHRIST", note: "Son of God, Son of Man" }
    ]
  }
};

const TreeNode = ({ person, level = 0, isLast = false }) => {
  const [expanded, setExpanded] = useState(level < 2);
  
  return (
    <div className="relative">
      <div className={`flex items-start gap-3 ${level > 0 ? 'ml-8 mt-2' : ''}`}>
        {level > 0 && (
          <div className="absolute left-0 top-0 w-6 h-6 border-l-2 border-b-2 border-amber-400 rounded-bl-lg" />
        )}
        
        <div 
          className={`
            bg-gradient-to-r from-amber-100 to-orange-100 
            rounded-lg p-3 border-2 border-amber-300 shadow-sm
            hover:shadow-md transition-all cursor-pointer
            ${person.children?.length > 0 ? 'hover:border-amber-500' : ''}
          `}
          onClick={() => person.children && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            {person.spouse ? (
              <Heart className="w-4 h-4 text-red-500" />
            ) : person.note?.includes('King') || person.note?.includes('Kingly') ? (
              <Crown className="w-4 h-4 text-yellow-600" />
            ) : (
              <Users className="w-4 h-4 text-amber-600" />
            )}
            <div>
              <p className="font-bold text-stone-800">{person.name}</p>
              {person.spouse && <p className="text-xs text-stone-600">& {person.spouse}</p>}
              {person.note && <p className="text-xs text-amber-700 italic">{person.note}</p>}
            </div>
          </div>
        </div>
      </div>

      {person.children && expanded && (
        <div className="mt-2">
          {person.children.map((child, idx) => (
            <TreeNode 
              key={idx} 
              person={child} 
              level={level + 1}
              isLast={idx === person.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FamilyTreeViewer() {
  const [selectedTree, setSelectedTree] = useState('abraham');
  const tree = familyTrees[selectedTree];

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-800">
          <Users className="w-6 h-6" />
          Biblical Family Trees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedTree} onValueChange={setSelectedTree}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="abraham">Patriarchs</TabsTrigger>
            <TabsTrigger value="david">David's Line</TabsTrigger>
            <TabsTrigger value="jesus">To Jesus</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTree} className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-xl font-bold text-stone-800">{tree.name}</h3>
              <p className="text-stone-600 text-sm">{tree.description}</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-stone-300 overflow-x-auto">
              {selectedTree === 'jesus' ? (
                <div className="flex flex-col items-center space-y-4">
                  {tree.tree.map((person, idx) => (
                    <div key={idx} className="text-center">
                      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 border-2 border-amber-300 inline-block">
                        <p className="font-bold text-stone-800">{person.name}</p>
                        {person.note && <p className="text-xs text-amber-700 italic">{person.note}</p>}
                      </div>
                      {idx < tree.tree.length - 1 && (
                        <div className="w-0.5 h-6 bg-amber-400 mx-auto my-1" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                tree.tree.map((person, idx) => (
                  <TreeNode key={idx} person={person} />
                ))
              )}
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-xs text-stone-700">
                <strong>Note:</strong> Click on names to expand/collapse branches. This family tree traces God's covenant promises through generations, ultimately fulfilled in Jesus Christ.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}