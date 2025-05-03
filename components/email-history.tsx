'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailHistoryEntry {
  id: string;
  company: string;
  title: string;
  person: string;
  draft: string;
}

const mockHistory: EmailHistoryEntry[] = [
  {
    id: '1',
    company: 'Tech Solutions Inc.',
    title: 'Follow-up on Project X',
    person: 'Alice Smith',
    draft: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: '2',
    company: 'Innovate Labs',
    title: 'Meeting Request for Q3 Planning',
    person: 'Bob Johnson',
    draft: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: '3',
    company: 'Global Corp',
    title: 'Proposal for Partnership',
    person: 'Charlie Brown',
    draft: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    id: '4',
    company: 'Tech Solutions Inc.',
    title: 'Onboarding Document Review',
    person: 'David Green',
    draft: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
];

export function EmailHistory() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = mockHistory.filter(entry =>
    entry.person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Input
          placeholder="Search by person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {filteredHistory.map(entry => (
            <div key={entry.id} className="border rounded-md p-4">
              <h3 className="font-bold">{entry.company}</h3>
              <p className="text-sm text-gray-600">{entry.title}</p>
              <p className="text-sm text-gray-500">To: {entry.person}</p>
              {/* Optionally display a snippet of the draft */}
              {/* <p className="text-sm mt-2">{entry.draft.substring(0, 100)}...</p> */}
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <p className="text-center text-gray-500">No history found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
