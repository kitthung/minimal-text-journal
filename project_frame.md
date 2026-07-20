# Blueprint: Minimalist Text Journal Web App (MVP)

This document contains both the product architecture specification and the operational parameters required for Google Antigravity (or a similar AI coding engine) to build the application.

---

## 1. Project Overview & Architecture
This is a specification for a responsive, minimalist, text-first journal web application. The core philosophy is distraction-free writing, absolute privacy by default, and a clean, typographic interface. 

### Architecture & Tech Stack (MVP)
*   **Frontend Framework:** Vanilla HTML5/CSS3/JavaScript or React (Single Page Application).
*   **Styling:** Responsive, utility-first CSS or modern custom properties. 
*   **Typography:** `Roboto Mono` (monospaced) for all user interface elements and text entry areas.
*   **Storage (MVP):** Synchronous local state persisting entirely to the browser's `localStorage`.
*   **Extensibility Requirements (Future Proofing):**
    *   The database service must be decoupled from the UI components to easily swap `localStorage` out for a cloud syncing solution (e.g., Firebase, Supabase) in v2.
    *   The layout must use clean, standardized web APIs so the code can easily be packaged into cross-platform hybrid apps (Android, iOS, iPadOS) using tools like Capacitor or Cordova later.

---

## 2. Data Models & State Management
The local storage schema must use a standardized JSON array of object entities representing journal entries.

### Entry Schema
```json
{
  "id": "uuid-string-v4",
  "title": "YYYY-MM-DD HH:MM", 
  "content": "Raw markdown or plain text string",
  "createdAt": "ISO-8601-Timestamp",
  "lastEditedAt": "ISO-8601-Timestamp"
}

Constraints & Defaults
Title Default: When a new entry is initialized, the title must automatically populate with the current local date and time in the format YYYY-MM-DD HH:MM. The user can freely overwrite or amend this text.

Timestamps: createdAt remains immutable once saved. lastEditedAt must update on every individual keystroke/auto-save event.

3. Core Features & User Flow
View 1: Homepage (Timeline Dashboard)
Primary Feed: A clean, vertical list of all past journal entries sorted in reverse-chronological order (newest first) based on lastEditedAt.

Card Metadata: Each entry snippet in the list must display:

The custom or default title.

A brief, unformatted preview snippet of the content.

A sub-label displaying the lastEditedAt timestamp (formatted accessibly, e.g., "Last edited: Jul 20, 2026, 3:30 PM").

Navigation Trigger: Tapping/clicking any entry card routes the user directly into View 2: Edit Page for that specific entity ID.

View 2: Edit / Compose Page
Workspace: A full-bleed, distraction-free writing interface containing two main fields: an editable Title input field and a large text area for Content.

Auto-Save: The app must automatically persist state changes to localStorage as the user types (debounce input by 500ms to optimize performance). There should be no manual "Save" button required.

Text Formatting: Support basic inline markdown rendering or formatting controls (Bold, Italics, Lists).

Writing Statistics UI: A small, unobtrusive counter anchored to the bottom of the viewport showing live calculations:

[X] Words | [Y] Characters

Global Search Mechanism
An persistent search bar component must sit at the top of the Homepage feed.

Query Scope: Performs a real-time, case-insensitive keyword query across both the title and content properties of all stored entries.

Result Weighting & Priority Sorting:

Priority 1: Entries where the search term matches text in the title.

Priority 2: Entries where the search term matches text inside the content body (excluding matches already surfaced by title priority).

4. UI/UX & Responsive Layout Requirements
Responsive Fabric
Desktop Layout:

A centered, maximum-width container (max-width: 800px) keeping text margins comfortable for long-form reading.

Action Trigger: The "Add New Entry" button (+ icon) must be anchored statically in the top-right corner of the application window.

Mobile Layout:

Fluid, edge-to-edge padding adapting seamlessly to portrait smartphone viewport dimensions.

Action Trigger: The "Add New Entry" button (+ icon) transforms into a floating action button (FAB) anchored to the bottom-right corner of the mobile screen.

Themes & Design Semantics
Font Family: Roboto Mono, monospace fallback.

Theme Engine: System settings detection by default (prefers-color-scheme), with a prominent, accessible UI toggle button visible in the header across all views to switch states manually.

Light Mode: Off-white/cream background (#FBFBF9 or similar soft neutral) paired with deep charcoal text (#1A1A1A) to reduce harsh contrast glare.

Dark Mode: Deep slate/black background (#121212) paired with soft, muted white text (#E0E0E0).