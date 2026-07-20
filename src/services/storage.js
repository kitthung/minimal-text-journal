import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'minimalist_journal_entries';

// Helper to generate local date-time string in YYYY-MM-DD HH:MM format
export const getFormattedDateTime = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// Helper to format ISO timestamp accessibly, e.g., "Jul 20, 2026, 3:30 PM"
export const formatAccessibleDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const DEFAULT_ENTRIES = [
  {
    id: 'sample-entry-1',
    title: 'Welcome to Your Journal',
    content: `# Minimalist Text Journal

Welcome! This is a responsive, distraction-free environment for your thoughts. 

Here are the key features:
* **Absolute Privacy**: All data resides locally in your browser's \`localStorage\` or syncs to your Supabase Cloud Database with Row Level Security (RLS).
* **Typographic Focus**: Styled with \`Roboto Mono\` and soft neutral color schemes.
* **Smart Search**: Real-time weighted search prioritizing titles first, then content body.
* **Stats UI**: Unobtrusive live word and character counters at the bottom of the editor.

To create a new entry, click the **+** button.`,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastEditedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const storage = {
  /**
   * Asynchronous fetch of all journal entries.
   * Uses Supabase when authenticated, or falls back to localStorage.
   */
  async getAllEntries(userId = null) {
    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', userId)
          .order('last_edited_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch entries error:', error);
          return this.getLocalEntries();
        }

        return (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          content: row.content,
          createdAt: row.created_at,
          lastEditedAt: row.last_edited_at
        }));
      } catch (err) {
        console.error('Failed fetching entries from cloud:', err);
        return this.getLocalEntries();
      }
    }

    return this.getLocalEntries();
  },

  /**
   * Fetch a single entry by ID.
   */
  async getEntryById(id, userId = null) {
    const entries = await this.getAllEntries(userId);
    return entries.find(entry => entry.id === id) || null;
  },

  /**
   * Save (UPSERT) a journal entry.
   */
  async saveEntry(entry, userId = null) {
    const now = new Date().toISOString();
    const entryId = entry.id || crypto.randomUUID();
    const cleanTitle = (entry.title || getFormattedDateTime()).trim();

    if (isSupabaseConfigured && userId) {
      try {
        const payload = {
          id: entryId,
          user_id: userId,
          title: cleanTitle,
          content: entry.content || '',
          created_at: entry.createdAt || now,
          last_edited_at: now
        };

        const { data, error } = await supabase
          .from('entries')
          .upsert(payload)
          .select()
          .single();

        if (error) {
          console.error('Supabase UPSERT error:', error);
          // Fallback to local storage on network failure
          return this.saveLocalEntry(entry);
        }

        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          lastEditedAt: data.last_edited_at
        };
      } catch (err) {
        console.error('Supabase save exception:', err);
        return this.saveLocalEntry(entry);
      }
    }

    return this.saveLocalEntry(entry);
  },

  /**
   * Delete an entry by ID.
   */
  async deleteEntry(id, userId = null) {
    if (isSupabaseConfigured && userId) {
      try {
        const { error } = await supabase
          .from('entries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Supabase delete error:', error);
        }
      } catch (err) {
        console.error('Supabase delete exception:', err);
      }
    }

    this.deleteLocalEntry(id);
  },

  // Local Storage Fallback Implementation Methods
  getLocalEntries() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllLocalEntries(DEFAULT_ENTRIES);
        return DEFAULT_ENTRIES;
      }
      const entries = JSON.parse(data);
      return entries.sort((a, b) => new Date(b.lastEditedAt) - new Date(a.lastEditedAt));
    } catch (error) {
      console.error('Failed to read entries from localStorage:', error);
      return [];
    }
  },

  saveLocalEntry(entry) {
    const entries = this.getLocalEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    const now = new Date().toISOString();
    let savedEntry;

    if (index >= 0) {
      savedEntry = {
        ...entries[index],
        title: entry.title.trim(),
        content: entry.content,
        lastEditedAt: now
      };
      entries[index] = savedEntry;
    } else {
      savedEntry = {
        id: entry.id || crypto.randomUUID(),
        title: (entry.title || getFormattedDateTime()).trim(),
        content: entry.content || '',
        createdAt: entry.createdAt || now,
        lastEditedAt: now
      };
      entries.push(savedEntry);
    }

    this.saveAllLocalEntries(entries);
    return savedEntry;
  },

  deleteLocalEntry(id) {
    const entries = this.getLocalEntries();
    const filtered = entries.filter(entry => entry.id !== id);
    this.saveAllLocalEntries(filtered);
  },

  saveAllLocalEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to write entries to localStorage:', error);
    }
  }
};
