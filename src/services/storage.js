import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'minimalist_journal_entries';

let syncErrorCallback = null;
export const setSyncErrorCallback = (cb) => {
  syncErrorCallback = cb;
};

// Helper to ensure all entry IDs are strictly valid v4 UUIDs required by PostgreSQL
export const ensureValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (id && uuidRegex.test(id)) {
    return id;
  }
  return crypto.randomUUID();
};

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
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    title: 'Welcome to Your Journal',
    content: `# Minimalist Text Journal

Welcome! This is a responsive, distraction-free environment for your thoughts. 

Here are the key features:
* **Cloud Sync**: All your entries automatically synchronize in real-time across your desktop and mobile devices.
* **Typographic Focus**: Choose between \`Roboto Mono\` and \`Galaxie Copernicus\`.
* **Smart Search**: Real-time weighted search prioritizing titles first, then content body.

To create a new entry, click the **+** button.`,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastEditedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const storage = {
  /**
   * Asynchronous fetch of all journal entries from Supabase Cloud.
   */
  async getAllEntries(userId = null) {
    if (isSupabaseConfigured && userId) {
      try {
        await this.syncLocalEntriesToCloud(userId);

        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', userId)
          .order('last_edited_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch entries error:', error);
          if (syncErrorCallback) syncErrorCallback(error.message || 'Failed to fetch entries from cloud');
          return this.getLocalEntries();
        }

        // Clear previous error on success
        if (syncErrorCallback) syncErrorCallback(null);

        const cloudEntries = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          content: row.content,
          createdAt: row.created_at,
          lastEditedAt: row.last_edited_at
        }));

        if (cloudEntries.length > 0) {
          this.saveAllLocalEntries(cloudEntries);
        }

        return cloudEntries;
      } catch (err) {
        console.error('Failed fetching entries from cloud:', err);
        if (syncErrorCallback) syncErrorCallback(err.message);
        return this.getLocalEntries();
      }
    }

    return this.getLocalEntries();
  },

  /**
   * Uploads any entries stored in localStorage to Supabase Cloud.
   */
  async syncLocalEntriesToCloud(userId) {
    if (!isSupabaseConfigured || !userId) return;

    try {
      const localEntries = this.getLocalEntries();
      const entriesToUpload = localEntries.filter(e => e.id !== 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c' && e.id !== 'sample-entry-1');

      if (entriesToUpload.length === 0) return;

      const payloads = entriesToUpload.map(e => ({
        id: ensureValidUUID(e.id),
        user_id: userId,
        title: e.title,
        content: e.content,
        created_at: e.createdAt || new Date().toISOString(),
        last_edited_at: e.lastEditedAt || new Date().toISOString()
      }));

      const { error } = await supabase.from('entries').upsert(payloads);
      if (error) {
        console.error('Error uploading local entries to cloud:', error);
        if (syncErrorCallback) syncErrorCallback(error.message);
      }
    } catch (err) {
      console.error('Failed syncing local entries to cloud:', err);
    }
  },

  /**
   * Fetch a single entry by ID.
   */
  async getEntryById(id, userId = null) {
    const validId = ensureValidUUID(id);

    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', validId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            content: data.content,
            createdAt: data.created_at,
            lastEditedAt: data.last_edited_at
          };
        }
      } catch (err) {
        console.error('Failed fetching single entry from cloud:', err);
      }
    }

    const localEntries = this.getLocalEntries();
    return localEntries.find(entry => entry.id === id || entry.id === validId) || null;
  },

  /**
   * Save (UPSERT) a journal entry to Supabase Cloud.
   */
  async saveEntry(entry, userId = null) {
    const now = new Date().toISOString();
    const entryId = ensureValidUUID(entry.id);
    const cleanTitle = (entry.title || getFormattedDateTime()).trim();

    if (isSupabaseConfigured && userId) {
      try {
        let createdAt = entry.createdAt;
        if (!createdAt) {
          const existing = await this.getEntryById(entryId, userId);
          createdAt = existing?.createdAt || now;
        }

        const payload = {
          id: entryId,
          user_id: userId,
          title: cleanTitle,
          content: entry.content || '',
          created_at: createdAt,
          last_edited_at: now
        };

        const { data, error } = await supabase
          .from('entries')
          .upsert(payload)
          .select()
          .single();

        if (error) {
          console.error('Supabase UPSERT error:', error);
          if (syncErrorCallback) syncErrorCallback(error.message);
          return this.saveLocalEntry({ ...entry, id: entryId });
        }

        if (syncErrorCallback) syncErrorCallback(null);

        const saved = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          lastEditedAt: data.last_edited_at
        };

        this.saveLocalEntry(saved);
        return saved;
      } catch (err) {
        console.error('Supabase save exception:', err);
        if (syncErrorCallback) syncErrorCallback(err.message);
        return this.saveLocalEntry({ ...entry, id: entryId });
      }
    }

    return this.saveLocalEntry({ ...entry, id: entryId });
  },

  /**
   * Delete an entry by ID from Supabase Cloud.
   */
  async deleteEntry(id, userId = null) {
    const validId = ensureValidUUID(id);

    if (isSupabaseConfigured && userId) {
      try {
        const { error } = await supabase
          .from('entries')
          .delete()
          .eq('id', validId)
          .eq('user_id', userId);

        if (error) {
          console.error('Supabase delete error:', error);
          if (syncErrorCallback) syncErrorCallback(error.message);
        }
      } catch (err) {
        console.error('Supabase delete exception:', err);
      }
    }

    this.deleteLocalEntry(id);
    this.deleteLocalEntry(validId);
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
        (payload) => {
          console.log('Realtime change received from cloud:', payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Realtime channel status:', status);
      });

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
    const validId = ensureValidUUID(entry.id);
    const index = entries.findIndex(e => e.id === entry.id || e.id === validId);
    const now = new Date().toISOString();
    let savedEntry;

    if (index >= 0) {
      savedEntry = {
        ...entries[index],
        id: validId,
        title: entry.title.trim(),
        content: entry.content,
        lastEditedAt: now
      };
      entries[index] = savedEntry;
    } else {
      savedEntry = {
        id: validId,
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
