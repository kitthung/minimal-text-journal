import React from 'react';
import EntryCard from './EntryCard';

export default function EntryList({ entries, query, onSelectEntry }) {
  // Weighted filter & search ranking logic
  const getFilteredEntries = () => {
    if (!query) return entries;

    const term = query.toLowerCase().trim();
    const titleMatches = [];
    const contentMatches = [];

    entries.forEach((entry) => {
      const matchesTitle = entry.title.toLowerCase().includes(term);
      const matchesContent = entry.content.toLowerCase().includes(term);

      if (matchesTitle) {
        titleMatches.push(entry);
      } else if (matchesContent) {
        contentMatches.push(entry);
      }
    });

    // Sub-sort each priority group by lastEditedAt (newest first)
    const sortByDate = (a, b) => new Date(b.lastEditedAt) - new Date(a.lastEditedAt);
    titleMatches.sort(sortByDate);
    contentMatches.sort(sortByDate);

    // Title matches take precedent, content matches follow
    return [...titleMatches, ...contentMatches];
  };

  const filteredEntries = getFilteredEntries();

  if (filteredEntries.length === 0) {
    return (
      <div className="no-results fade-in">
        <p>No journal entries match your search query.</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      {filteredEntries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onClick={() => onSelectEntry(entry.id)}
        />
      ))}
    </div>
  );
}
