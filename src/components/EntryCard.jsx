import React from 'react';
import { Calendar } from 'lucide-react';
import { formatAccessibleDate } from '../services/storage';

// Helper to strip markdown symbols for an unformatted preview snippet
const stripMarkdown = (markdown) => {
  if (!markdown) return '';
  return markdown
    // Remove headers
    .replace(/^#+\s+/gm, '')
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove formatting symbols: * _ ` ~
    .replace(/[*`_~]/g, '')
    // Convert multiple newlines/whitespace into a single space
    .replace(/\s+/g, ' ')
    .trim();
};

export default function EntryCard({ entry, onClick }) {
  const previewText = stripMarkdown(entry.content);

  return (
    <div 
      className="entry-card fade-in" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      aria-label={`Open entry: ${entry.title}`}
    >
      <div className="entry-card-header">
        <h2 className="entry-card-title">{entry.title}</h2>
      </div>
      {previewText ? (
        <p className="entry-card-preview">{previewText}</p>
      ) : (
        <p className="entry-card-preview" style={{ fontStyle: 'italic' }}>Empty entry</p>
      )}
      <div className="entry-card-meta">
        <Calendar className="w-3.5 h-3.5" />
        <span>Last edited: {formatAccessibleDate(entry.lastEditedAt)}</span>
      </div>
    </div>
  );
}
