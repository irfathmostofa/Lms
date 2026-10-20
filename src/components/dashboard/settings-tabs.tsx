'use client';

import { useState, type ReactNode } from 'react';

const TABS = [
  { id: 'settings', label: 'Settings' },
  { id: 'lookups', label: 'Lookups' },
  { id: 'categories', label: 'Categories' },
  { id: 'rooms', label: 'Classrooms' },
] as const;

export function SettingsTabs({
  settings,
  lookups,
  categories,
  rooms,
}: {
  settings: ReactNode;
  lookups: ReactNode;
  categories: ReactNode;
  rooms: ReactNode;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('settings');
  const panels = { settings, lookups, categories, rooms };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === item.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {panels[tab]}
    </div>
  );
}
