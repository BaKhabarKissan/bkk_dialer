# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BKK Dialer is a custom web-based dialer application with the following features:
- **Make/End Call** - Initiate and terminate voice calls
- **Mute** - Toggle microphone on/off during calls
- **Hold** - Place calls on hold
- **DND (Do Not Disturb)** - Block incoming calls
- **Recording** - Record calls
- **Account Management** - Add and manage multiple accounts

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a **Next.js 16** project using the **App Router** with **React 19** and **JavaScript** (not TypeScript).

### Directory Structure

- `app/` - Next.js App Router (pages, layouts, routes)
- `components/ui/` - shadcn/ui components
- `lib/utils.js` - Utility functions (includes `cn()` for Tailwind class merging)

### UI Stack

- **shadcn/ui** with "new-york" style - add components via `npx shadcn@latest add <component>`
- **Tailwind CSS v4** with CSS variables for theming (defined in `app/globals.css`)
- **lucide-react** for icons
- **tw-animate-css** for animations

### UI Guidelines

- **Always use shadcn/ui** for all UI components
- **Clean, component-based architecture** - break UI into small, reusable components
- **Never use hardcoded colors** - use shadcn's semantic Tailwind classes:
  - `bg-primary`, `text-primary-foreground` - primary actions
  - `bg-secondary`, `text-secondary-foreground` - secondary elements
  - `bg-muted`, `text-muted-foreground` - subtle/disabled states
  - `bg-destructive` - destructive actions
  - `bg-accent` - hover/focus states
  - `bg-card`, `bg-popover` - containers
  - `border-border`, `ring-ring` - borders and focus rings

### Path Aliases

Use `@/*` to import from the project root:
```javascript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```
