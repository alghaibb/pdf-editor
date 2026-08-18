# AGENTS.md

## Project Overview

This project is a production-quality web-based PDF editor built with Next.js.

The primary purpose of the application is to allow users to:

* Upload existing PDF files.
* Open PDFs directly in the browser.
* Edit existing text inside a PDF.
* Edit images and other supported PDF content.
* Save changes back to the PDF.
* Reopen previously edited documents.
* Maintain document versions where appropriate.
* Manage PDFs securely from a user account.

The most important product requirement is **real PDF content editing**.

Do not implement fake PDF text editing by covering existing text with white boxes or placing text annotations over the original content.

Existing editable PDF text should be modified through the PDF editing engine.

---

# Core Technology Stack

Use the following technologies unless there is a strong technical reason not to.

## Framework

* Next.js
* App Router
* React
* TypeScript
* React Compiler where supported

Do not use the legacy Pages Router.

---

## Package Manager

Use:

```bash
pnpm
```

Do not use npm or yarn unless explicitly requested.

Examples:

```bash
pnpm add package-name
pnpm add -D package-name
pnpm dev
pnpm build
```

---

## Styling

Use:

* Tailwind CSS
* shadcn/ui
* Lucide React icons

Prefer shadcn components over creating duplicate low-level UI primitives.

Reusable shadcn components belong in:

```text
src/components/ui/
```

Do not unnecessarily modify shadcn components when composition can accomplish the desired result.

---

## PDF Engine

Use:

```text
@pdftron/webviewer
```

Apryse WebViewer is the primary PDF rendering and editing engine.

Use Apryse functionality for:

* Viewing PDFs
* Editing existing PDF text
* Editing PDF images
* Annotations
* Forms
* Signatures
* Page manipulation
* PDF export
* Saving modified documents
* Redaction when implemented
* OCR when implemented

Do not attempt to recreate Apryse PDF functionality manually unless absolutely necessary.

---

# Main PDF Editing Requirement

The application must support editing **existing text contained inside a PDF**.

Correct:

```text
PDF contains:

Invoice Date: 15 August 2026

User clicks existing text.

User changes it to:

Invoice Date: 17 August 2026

The modified PDF is saved.
```

Incorrect:

```text
Original PDF text remains untouched.

A white rectangle is placed over it.

A new text box is rendered above the rectangle.
```

Do not implement the second approach as the primary editing system.

Use Apryse Content Editing functionality whenever the PDF supports editable content.

---

# Database

Use:

* PostgreSQL
* Prisma ORM

Do not use Drizzle.

Prisma is responsible for:

* Users
* Sessions
* Accounts
* Document metadata
* Document ownership
* Document versions
* Permissions
* Application metadata

PDF binary files should **not** normally be stored inside PostgreSQL.

---

# Authentication

Use:

```text
Better Auth
```

Better Auth handles:

* Authentication
* Sessions
* Accounts
* User identity

Use the Better Auth Prisma adapter where appropriate.

Do not implement a custom authentication system unless explicitly required.

Always verify ownership/permissions server-side before allowing access to private documents.

Never rely solely on client-side authorization.

---

# File Storage

Use:

```text
Cloudflare R2
```

Use the AWS S3-compatible SDK:

```text
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

PDF binary files belong in R2.

PostgreSQL should contain references and metadata about those files.

Example:

```text
Database

Document
├── id
├── userId
├── name
├── storageKey
├── size
├── mimeType
├── currentVersion
├── createdAt
└── updatedAt
```

R2:

```text
documents/
└── user-id/
    └── document-id/
        ├── current.pdf
        └── versions/
            ├── 1.pdf
            ├── 2.pdf
            └── 3.pdf
```

---

# Upload Architecture

Prefer direct browser-to-R2 uploads using signed URLs.

Preferred:

```text
Browser
   ↓
Request signed URL
   ↓
Next.js server validates request
   ↓
Signed URL returned
   ↓
Browser uploads directly to R2
```

Avoid unnecessarily sending large PDFs through the Next.js server.

Do not expose:

* R2 access keys
* R2 secret keys
* Database credentials
* Better Auth secrets

to client-side code.

---

# State Management

Use:

```text
Zustand
```

Use Zustand for application/editor UI state such as:

* Current document ID
* Current page
* Zoom level
* Sidebar state
* Dirty state
* Save state
* Selected tool
* Editor mode

Example concepts:

```ts
type EditorState = {
  documentId: string | null;
  dirty: boolean;
  saving: boolean;
  zoom: number;
};
```

Do not duplicate Apryse's internal PDF editing state in Zustand unnecessarily.

Apryse should manage PDF-specific editor state where possible.

Zustand should manage application state around the editor.

---

# Validation

Use:

```text
Zod
```

Validate all untrusted server input.

Examples:

* Route handler request bodies
* Search parameters
* Form submissions
* File metadata
* IDs
* Document names
* Upload requests
* User-controlled settings

Never trust values simply because they came from the application's frontend.

---

# Forms

Use:

* React Hook Form
* Zod
* `@hookform/resolvers`

Prefer schema-based validation.

Do not duplicate validation rules across client and server unnecessarily.

Server-side validation is authoritative.

---

# Toasts and Notifications

Use:

```text
sonner
```

Examples:

```text
PDF saved successfully
Upload failed
Document deleted
Changes restored
```

Do not use browser `alert()` for normal application feedback.

---

# Dates

Use:

```text
date-fns
```

when date formatting or date calculations require a utility library.

Do not install additional date libraries unless necessary.

---

# Local Persistence

Use:

```text
Dexie
```

for IndexedDB functionality where local persistence is necessary.

Potential uses include:

* Temporary editor recovery
* Unsaved session recovery
* Local document state
* Offline-safe metadata

Do not store secrets or sensitive authentication credentials in IndexedDB.

---

# Project Structure

Prefer feature locality.

The general structure should resemble:

```text
src/
├── app/
├── components/
├── lib/
├── stores/
├── hooks/
├── types/
└── schemas/
```

Do not create folders unless they serve an actual purpose.

---

# Route-Specific Components

Components used only by a particular page or route must live inside that route.

Use:

```text
_components/
```

Example:

```text
src/app/dashboard/
├── _components/
│   ├── document-card.tsx
│   ├── document-grid.tsx
│   └── upload-document-button.tsx
└── page.tsx
```

For a dynamic editor route:

```text
src/app/editor/[documentId]/
├── _components/
│   ├── pdf-editor.tsx
│   ├── editor-toolbar.tsx
│   ├── editor-sidebar.tsx
│   ├── save-button.tsx
│   └── zoom-controls.tsx
├── page.tsx
├── loading.tsx
└── error.tsx
```

A component that is only used within this route should **not** be placed in:

```text
src/components/
```

---

# Global Components

Components shared by multiple unrelated routes belong in:

```text
src/components/
```

Examples:

```text
src/components/
├── app-header.tsx
├── app-sidebar.tsx
├── logo.tsx
├── user-menu.tsx
└── ui/
```

The rule is:

```text
Used by one route
→ route/_components/

Used by multiple routes
→ src/components/

Generic UI primitive
→ src/components/ui/
```

Start components locally.

Only promote them to `src/components` when they are genuinely reused.

Do not prematurely create global components.

---

# Route-Specific Hooks

Hooks that only make sense for a particular route should live close to that route.

Example:

```text
src/app/editor/[documentId]/
├── _hooks/
│   ├── use-document-save.ts
│   └── use-editor-keyboard-shortcuts.ts
```

Hooks reused broadly can live in:

```text
src/hooks/
```

---

# Route-Specific Utilities

Route-specific utilities should remain within the route.

Example:

```text
src/app/editor/[documentId]/
├── _lib/
│   ├── editor-utils.ts
│   └── document-utils.ts
```

Globally reusable application utilities belong in:

```text
src/lib/
```

---

# Server Components

Prefer Server Components by default.

A component should remain a Server Component unless it requires something such as:

* Browser APIs
* `useState`
* `useEffect`
* Event listeners
* Zustand client state
* Apryse WebViewer
* Client-only libraries
* Interactive UI state

Do not add:

```tsx
"use client";
```

to files unnecessarily.

Keep the client boundary as low in the component tree as reasonably possible.

---

# Client Components

Use `"use client"` only where needed.

The actual Apryse PDF editor must run client-side.

Example:

```text
Server page
    ↓
Client PdfEditor
    ↓
Apryse WebViewer
```

Do not attempt to initialize WebViewer inside a Server Component.

---

# Data Fetching

Prefer server-side data loading for initial page data.

For example:

```text
/editor/[documentId]
```

should generally:

1. Determine the current authenticated user.
2. Query the document.
3. Verify the user can access it.
4. Return safe document information.
5. Render the client-side editor.

Do not expose entire database records to client components if only a small subset is needed.

---

# Server Actions and Route Handlers

Use the appropriate Next.js mechanism based on the task.

Use Server Actions for closely coupled application mutations where they provide a clean solution.

Use Route Handlers for things such as:

* File upload signing
* File download signing
* Webhooks
* Binary responses
* External API integrations
* PDF-specific endpoints
* APIs that need a stable HTTP interface

Avoid creating unnecessary API endpoints for operations that can be handled directly on the server.

---

# Prisma Rules

Keep Prisma server-only.

Never import the Prisma client into Client Components.

Use a shared Prisma singleton where appropriate for development environments.

Example location:

```text
src/lib/prisma.ts
```

Database operations should normally happen through server-side modules.

---

# Data Access

As the project grows, avoid scattering raw Prisma queries everywhere.

Prefer domain-specific server functions such as:

```text
getDocumentById()
getUserDocuments()
createDocument()
updateDocument()
deleteDocument()
createDocumentVersion()
```

Potential location:

```text
src/lib/documents/
```

or route-local server code when only used by one feature.

Avoid unnecessary abstraction for very small features.

---

# Document Ownership

Every private document must belong to a user or an explicitly supported collaborative entity.

Never retrieve a document with only:

```ts
where: {
  id: documentId
}
```

when ownership is required.

Prefer ownership-aware checks such as:

```ts
where: {
  id: documentId,
  userId: session.user.id,
}
```

or equivalent authorization logic.

A valid document ID alone must never grant access.

---

# PDF Save Architecture

The editor should support:

```text
Open document
    ↓
Edit PDF
    ↓
Mark document dirty
    ↓
User clicks Save
    ↓
Export edited PDF from Apryse
    ↓
Obtain secure R2 upload destination
    ↓
Upload edited PDF
    ↓
Create/update database version metadata
    ↓
Mark document saved
```

Display clear save states:

```text
Saved
Unsaved changes
Saving...
Save failed
```

Do not silently discard user edits.

---

# Document Versioning

Prefer maintaining version history rather than destroying the only previous copy.

Conceptually:

```text
Document
├── currentVersion
└── versions
    ├── 1
    ├── 2
    ├── 3
    └── 4
```

The user can continue seeing one logical filename:

```text
contract.pdf
```

while the backend retains previous versions.

Version retention rules can be added later.

---

# Unsaved Changes

Track whether the currently opened PDF has unsaved modifications.

Example states:

```text
dirty = false
```

after loading or successfully saving.

```text
dirty = true
```

after PDF content changes.

Warn the user before destructive navigation where appropriate.

Avoid overly aggressive dialogs.

---

# Autosave

Do not implement autosave until manual Save works reliably.

Initial priority:

```text
Edit
→ Save manually
→ Close
→ Reopen
→ Confirm edits remain
```

Only then add debounced autosaving.

---

# OCR

Scanned PDFs may contain no editable text.

Do not pretend image-only text is normal editable PDF text.

The workflow should eventually support:

```text
PDF loaded
    ↓
Detect whether useful text layer exists
    ↓
If not
    ↓
Offer OCR
```

OCR is an advanced feature and should not complicate the initial MVP.

---

# PDF Fonts

PDF fonts can involve:

* Embedded fonts
* Font subsets
* Missing glyphs
* Custom encodings
* Font substitution
* Right-to-left languages
* Complex scripts

Do not implement custom font substitution logic unless Apryse functionality is insufficient and the requirement is clearly defined.

Prefer the PDF engine's native font handling.

---

# Error Handling

Never silently swallow errors.

Incorrect:

```ts
try {
  await saveDocument();
} catch {}
```

Correct:

```ts
try {
  await saveDocument();
} catch (error) {
  console.error("Failed to save document", error);
  // show appropriate UI feedback
}
```

Provide useful error messages without exposing sensitive implementation details to users.

---

# Logging

Server logs may contain technical identifiers needed for debugging.

Do not log:

* Passwords
* Session tokens
* Authentication cookies
* R2 secrets
* Database credentials
* Entire private PDFs
* Sensitive user content unnecessarily

---

# File Upload Security

Validate uploaded files.

At minimum verify:

* File type
* File size
* Authentication
* Ownership
* Expected MIME type

Do not rely solely on the filename extension.

A file named:

```text
document.pdf
```

is not automatically a valid PDF.

Add deeper PDF validation and malware scanning when the application reaches production requirements.

---

# Environment Variables

Secrets belong in environment variables.

Examples may include:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
APRYSE_LICENSE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

Never hardcode secrets.

Never commit real secrets to Git.

Only variables intentionally safe for the browser may use the:

```text
NEXT_PUBLIC_
```

prefix.

Do not put private credentials behind `NEXT_PUBLIC_`.

---

# TypeScript Rules

Use TypeScript throughout the project.

Avoid:

```ts
any
```

unless there is a documented reason.

Prefer:

* Proper types
* Generics
* `unknown` where the type truly is unknown
* Type narrowing
* Zod inference
* Prisma-generated types

Do not suppress TypeScript errors just to make code compile.

Avoid:

```ts
// @ts-ignore
```

unless absolutely necessary and documented.

---

# Naming Conventions

## Components

Use PascalCase for component names.

```ts
PdfEditor
DocumentCard
UploadDialog
```

Files should generally use kebab-case:

```text
pdf-editor.tsx
document-card.tsx
upload-dialog.tsx
```

---

## Functions

Use camelCase:

```ts
saveDocument()
uploadPdf()
getDocumentById()
```

---

## Variables

Use camelCase:

```ts
documentId
currentPage
storageKey
```

---

## Constants

Use clear names.

For true application-level constants:

```ts
MAX_PDF_SIZE
DEFAULT_ZOOM
```

---

## Boolean Variables

Prefer names that clearly read as boolean conditions:

```ts
isSaving
isLoading
isDirty
hasPermission
canEdit
```

Avoid unclear names such as:

```ts
savingFlag
check
statusBool
```

---

# Imports

Prefer the configured `@/` alias.

Example:

```ts
import { Button } from "@/components/ui/button";
```

instead of deeply nested imports such as:

```ts
import { Button } from "../../../../components/ui/button";
```

Use relative imports when importing something very local if that improves clarity.

---

# Component Design

Keep components focused.

Avoid giant components responsible for:

* Data fetching
* Database writes
* PDF initialization
* Toolbar state
* Dialog state
* Uploads
* Saving
* Version history

all at the same time.

Break functionality into logical pieces.

However, do not split components into tiny files merely for the sake of abstraction.

Prefer useful boundaries over arbitrary boundaries.

---

# Hooks

Extract hooks when logic is:

* Reusable
* Stateful
* Complex enough to obscure the component
* Clearly a separate concern

Do not turn every three-line function into a custom hook.

---

# Comments

Write comments that explain **why**, not obvious statements about **what** the code already says.

Bad:

```ts
// Set saving to true
setSaving(true);
```

Useful:

```ts
// Keep the editor locked during export because Apryse can emit
// inconsistent file data if another save begins simultaneously.
setSaving(true);
```

---

# Code Duplication

Avoid substantial duplication.

If the same meaningful logic appears repeatedly, extract it.

Do not prematurely abstract code that only looks vaguely similar.

---

# Dependencies

Do not install packages unnecessarily.

Before adding a new dependency:

1. Check whether the project already has a package that solves the problem.
2. Check whether Next.js, React, Apryse, Prisma, or the browser already provide the capability.
3. Prefer established maintained libraries.
4. Avoid overlapping libraries solving the same problem.

Do not install:

* Another ORM
* Another authentication library
* Another global state manager
* Another PDF renderer

without a clear reason.

---

# UI Principles

The editor should feel like a professional desktop-style document application.

Prioritize:

* Large usable editing area
* Clear toolbar
* Fast interactions
* Visible save state
* Keyboard shortcuts
* Predictable navigation
* Minimal visual clutter

Avoid excessive:

* Cards
* Gradients
* Giant rounded containers
* Decorative animations
* Dashboard-style UI inside the actual editor workspace

The PDF itself should remain the primary visual focus.

---

# Responsive Design

The document dashboard should work across desktop and mobile.

The full PDF editing experience should prioritize desktop/tablet environments where precision editing is practical.

Do not damage the desktop editor experience merely to force every feature into a small mobile viewport.

Mobile can support a reduced interface if necessary.

---

# Accessibility

Use semantic HTML where possible.

Ensure:

* Buttons are actual buttons.
* Inputs have labels.
* Interactive elements can receive keyboard focus.
* Icon-only controls have accessible labels.
* Dialogs have appropriate titles/descriptions.
* Colour is not the only indicator of state.

Use shadcn/Radix accessibility features rather than bypassing them.

---

# Loading States

Use Next.js route loading files where appropriate:

```text
loading.tsx
```

Use skeletons or meaningful progress indicators for:

* Dashboard loading
* PDF initialization
* Uploading
* Saving
* Version restoration

Do not leave users staring at a blank page during expensive operations.

---

# Error Boundaries

Use:

```text
error.tsx
```

for route-level failures where appropriate.

Editor failures should attempt to provide a recovery path.

Do not destroy unsaved state unnecessarily after recoverable UI errors.

---

# Empty States

Provide useful empty states.

Example:

```text
No documents yet.

Upload your first PDF to start editing.
```

Avoid blank dashboards.

---

# Testing

Use:

* Vitest
* Testing Library
* Playwright

Unit tests should focus on meaningful business logic.

Component tests should focus on user-visible behaviour.

Playwright should eventually cover critical workflows such as:

```text
Sign in
→ Upload PDF
→ Open document
→ Edit content
→ Save
→ Reload
→ Confirm saved document
```

Do not write meaningless tests solely to increase test count.

---

# Formatting and Linting

Code should pass the project's configured linting and TypeScript checks before being considered complete.

Do not leave avoidable warnings.

Do not disable lint rules globally just to silence individual problems.

---

# Performance

PDF documents can be large.

Avoid:

* Reading large PDF files into unnecessary React state.
* Serializing PDF byte arrays into JSON.
* Passing large binary data through Server Component props.
* Uploading a large PDF through Next.js when a signed direct upload is available.
* Re-rendering the entire application on every editor interaction.

Keep binary data close to the PDF/storage layer.

---

# Browser APIs

Browser-specific APIs must only run in client-side code.

Check browser compatibility before relying on experimental functionality for core features.

Progressive enhancements such as direct local file saving may be added later but should not replace the core cloud-based document system unless explicitly decided.

---

# Security

Security is a core requirement.

Always consider:

* Authentication
* Authorization
* File ownership
* Signed URL expiry
* Input validation
* Upload validation
* Rate limiting
* Secret handling
* Cross-user document access
* Server/client boundaries

Never assume that hiding something in the UI prevents access.

Every sensitive server operation must perform its own authorization check.

---

# API Responses

Return consistent error shapes where practical.

Example:

```ts
{
  error: {
    code: "DOCUMENT_NOT_FOUND",
    message: "Document not found."
  }
}
```

Do not expose raw internal exceptions to users.

---

# MVP Priorities

Build the application in this order.

## Phase 1 — PDF Proof of Concept

```text
Open PDF
→ Render PDF
→ Edit existing PDF text
→ Export edited PDF
→ Reload exported PDF
→ Confirm edit persisted
```

This is the most important technical milestone.

---

## Phase 2 — Document Persistence

```text
Create document record
→ Upload PDF to R2
→ Load PDF from R2
→ Edit PDF
→ Save modified PDF to R2
```

---

## Phase 3 — User Documents

```text
Authenticated user
→ Documents dashboard
→ Upload
→ Open
→ Rename
→ Delete
```

---

## Phase 4 — Editor UX

Add:

* Toolbar
* Page thumbnails
* Zoom controls
* Undo
* Redo
* Save button
* Save status
* Keyboard shortcuts

---

## Phase 5 — Version History

Add:

* Document versions
* Previous version listing
* Restore version
* Current version tracking

---

## Phase 6 — Advanced Editing

Add features such as:

* Images
* Page manipulation
* Forms
* Annotations
* Signatures
* Redaction

---

## Phase 7 — OCR

Add scanned-PDF handling only after normal PDFs work reliably.

---

# Do Not Prematurely Build

Do not prioritize these before the core editing and persistence workflow works:

* AI chat with PDF
* Team collaboration
* Real-time multiplayer editing
* OCR
* Payments
* Mobile application
* Google Drive integration
* Dropbox integration
* Advanced sharing
* Public links
* Enterprise roles
* Complex subscription billing

The foundation must work first.

---

# Definition of Core Success

The application's first major success condition is:

```text
1. User opens an existing PDF.
2. The PDF contains selectable text.
3. User selects existing text.
4. User modifies the existing text.
5. User saves the PDF.
6. User closes the editor.
7. User reopens the same document.
8. The modification is still present.
```

Until this works reliably, prioritize it over secondary features.

---

# Agent Behaviour

When modifying this repository:

1. Inspect existing code before creating replacements.
2. Follow the project's existing architecture.
3. Do not rewrite unrelated files.
4. Do not install unnecessary dependencies.
5. Do not change the technology stack without explicit instruction.
6. Keep route-specific code inside its route where practical.
7. Keep globally reused code inside shared directories.
8. Prefer Server Components unless client behaviour is required.
9. Validate server input.
10. Preserve strict TypeScript.
11. Maintain authentication and authorization boundaries.
12. Do not expose secrets.
13. Do not implement fake PDF content editing.
14. Keep changes focused on the requested feature.
15. Reuse existing utilities and components before creating new ones.

---

# When Creating New Features

Before implementing a feature, determine:

```text
Is this only used by one route?
    ↓
YES → Keep it inside the route.

Is it shared across multiple routes?
    ↓
YES → Put it in src/components, src/hooks, or src/lib as appropriate.

Does it need browser functionality?
    ↓
YES → Client Component.

Otherwise
    ↓
Prefer server-side implementation.
```

---

# Preferred Editor Route Structure

The PDF editor will generally follow:

```text
src/app/editor/[documentId]/
├── _components/
│   ├── pdf-editor.tsx
│   ├── editor-shell.tsx
│   ├── editor-toolbar.tsx
│   ├── editor-sidebar.tsx
│   ├── page-thumbnails.tsx
│   ├── zoom-controls.tsx
│   ├── save-button.tsx
│   └── save-status.tsx
│
├── _hooks/
│   ├── use-editor-state.ts
│   └── use-document-save.ts
│
├── _lib/
│   └── editor-utils.ts
│
├── error.tsx
├── loading.tsx
└── page.tsx
```

Do not treat this as a requirement to create every file immediately.

Create files when they become necessary.

---

# Preferred Dashboard Route Structure

Example:

```text
src/app/dashboard/
├── _components/
│   ├── document-card.tsx
│   ├── document-grid.tsx
│   ├── document-actions.tsx
│   ├── upload-document-button.tsx
│   └── empty-documents.tsx
├── loading.tsx
└── page.tsx
```

---

# General Philosophy

Prefer:

```text
Simple
Typed
Secure
Maintainable
Feature-local
Server-first
Production-minded
```

over:

```text
Overengineered
Highly abstracted
Dependency-heavy
Client-everywhere
Prematurely optimized
```

The application should remain understandable as it grows.

Every abstraction should solve a real problem.

Every dependency should have a purpose.

Every client boundary should be intentional.

Every sensitive operation should be authorized.

And most importantly:

**The PDF editor must edit real existing PDF content and save those changes reliably.**
