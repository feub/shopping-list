# Architecture

## Tech Stack

- **React Native 0.81.5** with **Expo SDK 54** (development builds, not Expo Go)
- **TypeScript 5.9** with strict mode
- **Supabase** for PostgreSQL database, auth, real-time subscriptions, and RLS
- **React Navigation** for routing (bottom tabs + stack for modals)
- **Expo Notifications** with Firebase Cloud Messaging for Android push notifications

## Directory Structure

```
src/
├── components/
│   ├── list/                  # Shopping list UI components
│   │   ├── AddItemInput.tsx   # Text input with quantity & importance toggles
│   │   ├── DraggableList.tsx  # Drag-to-reorder wrapper (react-native-draggable-flatlist)
│   │   ├── ListItem.tsx       # Single item row (checkbox, importance, quantity badge)
│   │   ├── SwipeableItem.tsx  # Swipe-to-delete gesture wrapper
│   │   ├── ShareListModal.tsx # Share list with other users, manage roles
│   │   └── ListSelectorModal.tsx # Switch between lists, create/delete lists
│   └── savedLists/
│       ├── CreateSavedListModal.tsx
│       └── EditSavedListModal.tsx
├── context/
│   ├── AuthContext.tsx         # User/session state, sign in/up/out
│   └── ThemeContext.tsx        # Theme mode, font size, persisted to AsyncStorage
├── hooks/
│   ├── useList.ts             # Core hook: items CRUD, real-time subscription, reorder
│   └── useTheme.ts            # Shortcut to ThemeContext
├── navigation/
│   ├── AppNavigator.tsx       # Root: auth check -> AuthStack or MainTabs
│   ├── AuthNavigator.tsx      # Login/Signup stack
│   └── types.ts               # Navigation param types
├── screens/
│   ├── ListScreen.tsx         # Main shopping list (primary screen)
│   ├── SavedListsScreen.tsx   # List templates
│   ├── FavoritesScreen.tsx    # Quick-add favorite items
│   ├── SettingsScreen.tsx     # Profile, theme, font size, version
│   ├── AuthScreen.tsx         # Container for auth forms
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   └── EditSavedListScreen.tsx # Modal screen for editing saved list
├── services/
│   ├── notifications.ts       # Push notification registration & sending
│   ├── storage/
│   │   └── AsyncStorageService.ts # Local caching (prepared for offline)
│   └── supabase/
│       ├── client.ts          # Supabase client init (expo-secure-store for tokens)
│       ├── auth.ts            # AuthService
│       ├── lists.ts           # ListsService (CRUD, members, sharing)
│       ├── items.ts           # ItemsService (CRUD, reorder, bulk ops)
│       ├── savedLists.ts      # SavedListsService
│       ├── favorites.ts       # FavoritesService
│       ├── profiles.ts        # ProfilesService
│       ├── realtime.ts        # RealtimeService (WebSocket subscriptions)
│       └── index.ts           # Re-exports all services
├── theme/
│   ├── colors.ts              # Light/dark color palettes
│   ├── typography.ts          # Font sizes, weights, families
│   ├── spacing.ts             # Spacing, border radius, icon sizes
│   └── index.ts               # createTheme() factory
├── types/
│   ├── database.ts            # Supabase table types (Row, Insert, Update)
│   └── models.ts              # App-level interfaces (Item, List, etc.)
└── utils/
    ├── validation.ts          # Input validators (email, password, item text, etc.)
    ├── sanitization.ts        # XSS/HTML sanitization, max lengths
    └── logger.ts              # Safe logger that redacts sensitive fields
```

## Navigation Structure

```
AppNavigator (Root)
├── Authenticated:
│   ├── MainTabs (Bottom Tabs)
│   │   ├── List          -> ListScreen
│   │   ├── SavedLists    -> SavedListsScreen
│   │   ├── Favorites     -> FavoritesScreen
│   │   └── Settings      -> SettingsScreen
│   └── EditSavedList     -> EditSavedListScreen (modal)
└── Not Authenticated:
    └── AuthNavigator (Stack)
        ├── Login         -> LoginScreen
        └── Signup        -> SignupScreen
```

## Data Flow

1. **Auth**: Supabase Auth -> AuthContext -> screens read `useAuth()`
2. **Items**: ListScreen -> `useList(listId)` -> ItemsService -> Supabase
3. **Real-time**: `useList` subscribes via RealtimeService (Postgres changes channel)
4. **Notifications**: AuthContext registers token on login -> ListScreen sends push on item add
5. **Theme**: ThemeContext -> AsyncStorage persistence -> `useTheme()` in components

## Key Design Decisions

- **No backend server**: Push notifications are sent client-to-client via Expo Push API. Acceptable for a small family app.
- **RPC for list creation**: `create_list_with_owner()` is a SECURITY DEFINER function that atomically creates a list and its owner membership, solving the RLS chicken-and-egg problem.
- **Soft deletes for items**: `is_deleted` flag rather than hard delete, to support future offline sync propagation.
- **Hard deletes for lists**: Lists are hard-deleted (with cascade to list_members), since list deletion is owner-only and immediate.
- **Service pattern**: All Supabase calls go through static service classes (e.g., `ItemsService.createItem()`), never direct `supabase.from()` in components.
