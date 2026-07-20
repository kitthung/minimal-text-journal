import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Bold, Italic, Heading, Eye, Edit2, Trash2 } from 'lucide-react';
import { marked } from 'marked';

// Configure marked to preserve single and double line breaks
marked.setOptions({
  breaks: true,
  gfm: true
});

// Bidirectional HTML to Markdown parser preserving precise line breaks
const htmlToMarkdown = (html) => {
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  const traverse = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    let childContent = '';
    node.childNodes.forEach(child => {
      childContent += traverse(child);
    });

    switch (node.nodeName) {
      case 'H1':
        return `# ${childContent.trim()}\n\n`;
      case 'H2':
        return `## ${childContent.trim()}\n\n`;
      case 'H3':
        return `### ${childContent.trim()}\n\n`;
      case 'STRONG':
      case 'B':
        return `**${childContent}**`;
      case 'EM':
      case 'I':
        return `*${childContent}*`;
      case 'LI': {
        const parent = node.parentNode;
        if (parent && parent.nodeName === 'OL') {
          const index = Array.from(parent.children).indexOf(node) + 1;
          return `${index}. ${childContent}\n`;
        }
        return `* ${childContent}\n`;
      }
      case 'UL':
      case 'OL':
        return `\n${childContent}\n`;
      case 'P':
      case 'DIV':
        if (childContent === '' || childContent === '\n') {
          return '\n';
        }
        return `${childContent}\n`;
      case 'BR':
        return '\n';
      case 'CODE':
        return `\`${childContent}\``;
      case 'PRE':
        return `\`\`\`\n${childContent}\n\`\`\`\n\n`;
      default:
        return childContent;
    }
  };

  return traverse(doc.body);
};

const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  try {
    return marked.parse(markdown);
  } catch (e) {
    console.error('Failed to parse Markdown to HTML:', e);
    return markdown;
  }
};

export default function Editor({ entry, onSave, onDelete, onBack }) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const editorRef = useRef(null);
  const isInitialMount = useRef(true);

  // Sync inputs when active entry changes
  useEffect(() => {
    setTitle(entry.title);
    setContent(entry.content);
    setIsDirty(false);
    setIsSaving(false);
    isInitialMount.current = true;
    
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(entry.content);
    }
  }, [entry.id]);

  // Sync innerHTML when returning to Edit Mode from Preview Mode
  useEffect(() => {
    if (!previewMode && editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(content);
    }
  }, [previewMode]);

  // Debounced auto-save loop
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsSaving(true);
    const debounceTimer = setTimeout(() => {
      if (isDirty) {
        onSave({
          id: entry.id,
          title,
          content
        });
        setIsDirty(false);
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [title, content, isDirty, entry.id, onSave]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  // Triggers change on typing/formatting edits
  const triggerChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = htmlToMarkdown(html);
      setContent(markdown);
      setIsDirty(true);
    }
  };

  // Keyboard shortcut listener (Cmd/Ctrl + B for Bold, Cmd/Ctrl + I for Italic)
  const handleKeyDown = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold', false);
        triggerChange();
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic', false);
        triggerChange();
      }
    }
  };

  // Visual text formatting operations
  const handleBoldClick = () => {
    document.execCommand('bold', false);
    triggerChange();
  };

  const handleItalicClick = () => {
    document.execCommand('italic', false);
    triggerChange();
  };

  const handleHeadingClick = () => {
    document.execCommand('formatBlock', false, '<h1>');
    triggerChange();
  };

  const getStats = () => {
    const charCount = content ? content.length : 0;
    const wordCount = content
      ? content.trim().split(/\s+/).filter(Boolean).length
      : 0;
    return { words: wordCount, chars: charCount };
  };

  const stats = getStats();

  return (
    <div className="editor-wrapper fade-in">
      <div className="editor-header">
        <button onClick={onBack} className="editor-back-btn" aria-label="Go back to timeline">
          <ChevronLeft className="w-5 h-5" />
          <span>Timeline</span>
        </button>

        <div className="editor-actions">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-icon"
            title={previewMode ? 'Edit Mode' : 'Read-only Mode'}
            aria-label={previewMode ? 'Switch to editor' : 'Switch to read-only preview'}
          >
            {previewMode ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this entry?')) {
                onDelete(entry.id);
              }
            }}
            className="btn-icon"
            style={{ color: '#e74c3c', borderColor: 'var(--border-color)' }}
            title="Delete Entry"
            aria-label="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        type="text"
        className="editor-title-input"
        placeholder="Entry Title"
        value={title}
        onChange={handleTitleChange}
        disabled={previewMode}
      />

      {!previewMode && (
        <div className="formatting-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleBoldClick}
            title="Bold text (Ctrl/Cmd+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleItalicClick}
            title="Italic text (Ctrl/Cmd+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleHeadingClick}
            title="Heading block"
          >
            <Heading className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="workspace-container">
        <div
          ref={editorRef}
          contentEditable={!previewMode}
          onInput={triggerChange}
          onKeyDown={handleKeyDown}
          className="textarea-field custom-scrollbar"
          placeholder="Start writing your thoughts here..."
          aria-label="Journal entry content"
          style={{
            display: previewMode ? 'none' : 'block',
            minHeight: '100%',
            outline: 'none'
          }}
        />

        {previewMode && (
          <div 
            className="markdown-preview custom-scrollbar"
            style={{ display: 'block' }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        )}
      </div>

      <div className="stats-bar">
        <div className="stats-bar-content">
          <div>
            <span>{stats.words} Words</span>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <span>{stats.chars} Characters</span>
          </div>
          <div className="save-indicator">
            <div className={`save-dot ${isSaving ? 'active' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'All changes saved'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
