# Shopping List App

A collaborative shopping list app built with React Native (Expo SDK 54) and Supabase.

## Context Files

Read these files at the start of every conversation to understand the project:

- `claude-context/architecture.md` - Tech stack, directory structure, navigation, data flow
- `claude-context/conventions.md` - Code style, naming, patterns, theming rules
- `claude-context/requirements.md` - Product requirements and technical constraints
- `claude-context/database.md` - Schema, RLS policies, functions, gotchas
- `claude-context/features.md` - What's implemented vs planned

## Quick Reference

- **Build**: `npx expo run:android` (development build, not Expo Go)
- **APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Supabase**: RLS on all tables. List creation uses `create_list_with_owner()` RPC.
- **Notifications**: Require dev build + Firebase (`android/app/google-services.json`)
- **Types**: Database types in `src/types/database.ts`, app models in `src/types/models.ts`. Map snake_case DB columns to camelCase in hooks/services.
- **Services**: All DB access through static service classes in `src/services/supabase/`. Never call `supabase.from()` directly in components.
