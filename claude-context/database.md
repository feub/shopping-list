# Database

## Overview

PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables. Auth handled by Supabase Auth (`auth.users`).

## Tables

### profiles
Extends `auth.users` (1:1 relationship). Auto-created by `handle_new_user()` trigger.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | References auth.users(id) ON DELETE CASCADE |
| email | TEXT | |
| display_name | TEXT | Defaults to email prefix |
| avatar_url | TEXT | |
| push_token | TEXT | Expo push notification token |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### lists
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| description | TEXT | |
| created_by | UUID FK | -> auth.users |
| is_archived | BOOLEAN | Default false |
| version | INTEGER | For offline sync |
| last_synced_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### list_members (junction table for sharing)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| list_id | UUID FK | -> lists ON DELETE CASCADE |
| user_id | UUID FK | -> profiles |
| role | TEXT | 'viewer', 'editor', or 'owner' |
| created_at | TIMESTAMPTZ | |

UNIQUE constraint on (list_id, user_id).

### items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| list_id | UUID FK | -> lists ON DELETE CASCADE |
| text | TEXT NOT NULL | |
| quantity | TEXT | |
| notes | TEXT | |
| is_bought | BOOLEAN | Default false |
| is_deleted | BOOLEAN | Soft delete, default false |
| is_important | BOOLEAN | Priority flag, default false |
| order_index | INTEGER | For drag-to-reorder |
| created_by | UUID FK | -> profiles (shows "added by") |
| version | INTEGER | For offline sync |
| last_synced_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### saved_lists
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | -> auth.users |
| name | TEXT NOT NULL | |
| description | TEXT | |
| usage_count | INTEGER | Default 0 |
| last_used_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### saved_list_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| saved_list_id | UUID FK | -> saved_lists ON DELETE CASCADE |
| text | TEXT NOT NULL | |
| quantity | TEXT | |
| notes | TEXT | |
| order_index | INTEGER | Default 0 |
| created_at | TIMESTAMPTZ | |

### favorite_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | -> auth.users |
| text | TEXT NOT NULL | |
| quantity | TEXT | |
| notes | TEXT | |
| usage_count | INTEGER | Default 0 |
| last_used_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

## RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | All users | Own profile | Own profile | - |
| lists | Members only (via `is_list_member()`) | `WITH CHECK (true)` + RPC | Owner/Editor | Owner |
| list_members | Members of the list | Owner | Owner | Owner |
| items | Members of the list | Editor/Owner of list | Editor/Owner | Editor/Owner |
| saved_lists | Creator only | Creator | Creator | Creator |
| saved_list_items | Creator of parent saved_list | Creator | Creator | Creator |
| favorite_items | Own items | Own items | Own items | Own items |

## SECURITY DEFINER Functions

### `is_list_member(p_list_id UUID, p_user_id UUID) -> BOOLEAN`
Checks if user is a member of a list. Used in RLS policies to avoid infinite recursion.

### `is_list_owner(p_list_id UUID, p_user_id UUID) -> BOOLEAN`
Checks if user is the owner of a list.

### `create_list_with_owner(p_name TEXT, p_description TEXT) -> UUID`
Atomically creates a list and adds the current user as owner in list_members. Solves the RLS chicken-and-egg problem where INSERT needs RETURNING but SELECT policy requires membership that doesn't exist yet.

### `handle_new_user() -> TRIGGER`
Fires after INSERT on `auth.users`. Creates a profile row with email and display_name.

## Migrations

Stored in `supabase/migrations/`. 11 migration files (001 through 011) covering initial schema, favorites, FK fixes, RLS policy iterations, important items, and push tokens.

## Known Gotchas

1. **List creation must use RPC**: Direct INSERT into `lists` fails because the RETURNING clause triggers SELECT RLS, which requires list_members that don't exist yet. Always use `create_list_with_owner()`.
2. **RLS helper functions**: `is_list_member()` and `is_list_owner()` exist to prevent infinite recursion in RLS policies that would otherwise query `list_members` which itself has RLS.
3. **Items use soft delete**: `is_deleted = true` rather than DELETE, for future offline sync. Services filter with `is_deleted = false`.
4. **Lists use hard delete**: Owner deletes list -> cascade removes list_members and items.
