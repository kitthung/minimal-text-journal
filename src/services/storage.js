import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'minimalist_journal_entries';

export const getFormattedDateTime = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

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
* **Cloud Sync**: All your entries automatically synchronize in real-time across your desktop and mobile devices.
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
   */
  async getAllEntries(userId = null) {
    if (isSupabaseConfigured && userId) {
      try {
        // Sync any pending local entries to cloud first
        await this.syncLocalEntriesToCloud(userId);

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
   * Uploads any entries stored in localStorage to Supabase Cloud under the logged-in user.
   */
  async syncLocalEntriesToCloud(userId) {
    if (!isSupabaseConfigured || !userId) return;

    try {
      const localEntries = this.getLocalEntries();
      // Filter out default sample entry if cloud already has entries
      const entriesToUpload = localEntries.filter(e => e.id !== 'sample-entry-1');

      if (entriesToUpload.length === 0) return;

      const payloads = entriesToUpload.map(e => ({
        id: e.id,
        user_id: userId,
        title: e.title,
        content: e.content,
        created_at: e.createdAt || new Date().toISOString(),
        last_edited_at: e.lastEditedAt || new Date().toISOString()
      }));

      const { error } = await supabase.from('entries').upsert(payloads);
      if (!error) {
        // Clear pushed local entries to avoid duplicated sync
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed syncing local entries to cloud:', err);
    }
  },

  /**
   * Fetch a single entry by ID.
   */
  async getEntryById(id, userId = null) {
    const entries = await this.getAllEntries(userId);
    return entries.find(entry => entry.id === id) || null;
  },

  /**
   * Save (UPSERT) a journal entry to Supabase Cloud.
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
   * Delete an entry by ID from Supabase Cloud.
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

  /**
   * Realtime Subscription Listener for multi-device cross-sync.
   */
  subscribeToChanges(userId, onUpdate) {
    if (!isSupabaseConfigured || !userId) return () => {};

    const channel = supabase
      .channel(`public:entries:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${userId}`
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
