import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBox({ query, setQuery }) {
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search entries..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search journal entries"
      />
      <Search className="search-icon" />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="btn-icon absolute right-2 top-1/2 -translate-y-1/2 border-none h-8 w-8"
          style={{ 
            position: 'absolute', 
            right: '0.5rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            border: 'none',
            height: '2rem',
            width: '2rem'
          }}
          aria-label="Clear search query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
