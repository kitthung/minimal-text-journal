import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Settings } from 'lucide-react';
import { storage, getFormattedDateTime } from './services/storage';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import ThemeToggle from './components/ThemeToggle';
import SearchBox from './components/SearchBox';
import EntryList from './components/EntryList';
import Editor from './components/Editor';
import AuthGate from './components/AuthGate';
import SettingsView from './components/SettingsView';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(isSupabaseConfigured);
  const [entries, setEntries] = useState([]);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'edit' | 'settings'
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFont, setActiveFont] = useState('roboto-mono');

  const userId = session?.user?.id || null;

  // Restore font preference on app launch
  useEffect(() => {
    const savedFont = localStorage.getItem('journal_font_preference') || 'roboto-mono';
    setActiveFont(savedFont);
    document.documentElement.setAttribute('data-font', savedFont);
  }, []);

  const handleSelectFont = (fontKey) => {
    setActiveFont(fontKey);
    localStorage.setItem('journal_font_preference', fontKey);
    document.documentElement.setAttribute('data-font', fontKey);
  };

  // Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadingAuth(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    // Listen to session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch entries when session or userId changes
  useEffect(() => {
    if (loadingAuth) return;

    let isMounted = true;
    storage.getAllEntries(userId).then((fetchedEntries) => {
      if (isMounted) {
        setEntries(fetchedEntries);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId, loadingAuth]);

  // Hash-based router
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash === '#/settings') {
        setActiveEntryId(null);
        setCurrentView('settings');
      } else if (hash.startsWith('#/edit/')) {
        const id = hash.replace('#/edit/', '');
        const entryExists = await storage.getEntryById(id, userId);
        if (entryExists || id === 'new') {
          setActiveEntryId(id);
          setCurrentView('edit');
        } else {
          window.location.hash = '#/';
        }
      } else {
        setActiveEntryId(null);
        setCurrentView('home');
        const refreshed = await storage.getAllEntries(userId);
        setEntries(refreshed);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userId]);

  const handleAddNewEntry = async () => {
    const newId = crypto.randomUUID();
    const newEntry = {
      id: newId,
      title: getFormattedDateTime(),
      content: '',
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString()
    };

    await storage.saveEntry(newEntry, userId);
    const refreshed = await storage.getAllEntries(userId);
    setEntries(refreshed);
    
    window.location.hash = `#/edit/${newId}`;
  };

  const handleSaveEntry = async (updatedEntry) => {
    await storage.saveEntry(updatedEntry, userId);
    const refreshed = await storage.getAllEntries(userId);
    setEntries(refreshed);
  };

  const handleDeleteEntry = async (id) => {
    await storage.deleteEntry(id, userId);
    const refreshed = await storage.getAllEntries(userId);
    setEntries(refreshed);
    window.location.hash = '#/';
  };

  const handleSelectEntry = (id) => {
    window.location.hash = `#/edit/${id}`;
  };

  const handleBackToTimeline = () => {
    window.location.hash = '#/';
  };

  const handleGoToSettings = () => {
    window.location.hash = '#/settings';
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      window.location.hash = '#/';
    }
  };

  // Render loading indicator during initial auth check
  if (loadingAuth) {
    return (
      <div className="app-container flex justify-center items-center h-screen">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-app)' }}>Loading session...</p>
      </div>
    );
  }

  // Render Auth Gate if no active user session
  if (!session) {
    return <AuthGate />;
  }

  const activeEntry = activeEntryId ? entries.find(e => e.id === activeEntryId) : null;

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <a href="#/" className="brand" onClick={handleBackToTimeline}>
            <BookOpen className="w-5 h-5" />
            <span>log</span>
            <span className="brand-cursor"></span>
          </a>
          
          <div className="header-actions">
            {currentView === 'home' && (
              <button 
                onClick={handleAddNewEntry} 
                className="btn-icon add-entry-btn-desktop"
                aria-label="Add new journal entry"
                title="New Entry"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            {session && (
              <button
                onClick={handleGoToSettings}
                className="btn-icon"
                aria-label="Application Settings"
                title="Settings (General & Profile)"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-container">
        {currentView === 'home' ? (
          <div className="fade-in">
            <SearchBox query={searchQuery} setQuery={setSearchQuery} />
            <EntryList 
              entries={entries} 
              query={searchQuery} 
              onSelectEntry={handleSelectEntry} 
            />
          </div>
        ) : currentView === 'settings' ? (
          <SettingsView 
            user={session.user} 
            activeFont={activeFont}
            onSelectFont={handleSelectFont}
            onBack={handleBackToTimeline} 
            onSignOut={handleSignOut} 
          />
        ) : (
          activeEntry && (
            <Editor 
              entry={activeEntry} 
              onSave={handleSaveEntry} 
              onDelete={handleDeleteEntry}
              onBack={handleBackToTimeline}
            />
          )
        )}
      </main>

      {/* Floating Action Button (FAB) for Mobile View */}
      {currentView === 'home' && (
        <button 
          onClick={handleAddNewEntry} 
          className="add-entry-btn-mobile"
          aria-label="Add new journal entry"
          title="New Entry"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
