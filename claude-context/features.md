# Features - Current State

## Implemented

### Core Shopping List
- Add items with text, optional quantity, and optional importance flag
- Toggle items as bought (checkbox) - bought items move to bottom section with faded style
- Swipe left to delete items (soft delete)
- Drag-to-reorder unbought items (react-native-draggable-flatlist)
- "Clear bought" button to remove all checked items
- Pull-to-refresh
- Empty state messaging

### Important Items
- `!` toggle button in AddItemInput to flag new items as important
- `!` toggle button on each existing unbought item
- Important items sort to top of unbought list
- Visual styling: 3px amber left border, tinted amber background, bold text, flag icon
- Importance only visible on unbought items

### Multiple Lists
- List selector modal (hamburger icon in header)
- Create new lists (via `create_list_with_owner` RPC)
- Delete lists (only if empty - checks for items first, confirmation dialog)
- Default list persisted to AsyncStorage across sessions
- List name shown in header

### Sharing & Collaboration
- Share button in header with member count badge
- Invite users by email
- Role assignment: viewer, editor, owner
- Remove members (owner only)
- Real-time sync via Supabase Postgres changes (WebSocket)
- "Added by" label on items showing who added them

### Push Notifications
- Expo push notifications via Firebase Cloud Messaging (Android)
- Token registered on app launch / sign-in, stored in profiles.push_token
- When a user adds an item to a shared list, other members receive a push notification
- Notification shows list name as title and "{user} added {item}" as body
- Requires development build (not Expo Go) - removed from Expo Go in SDK 53
- Fire-and-forget pattern: notification failures don't affect item creation

### Saved Lists (Templates)
- Create templates from current shopping list items
- View all saved templates with usage stats
- Edit template name, description, and items
- Clone/merge template into active shopping list
- Delete templates

### Favorites
- Add favorite items for quick reuse
- Usage count and last-used tracking
- One-tap add favorite to current shopping list
- Delete favorites

### Authentication
- Email + password sign up with display name
- Email + password sign in
- Sign out
- Automatic profile creation on sign up (database trigger)

### Theming
- Light mode (earthy palette: cream background, burnt orange primary)
- Dark mode (adjusted palette)
- System mode (follows device setting)
- Font size: small, medium, large (accessibility)
- Preferences persisted to AsyncStorage

### Security
- RLS on all tables (database-level enforcement)
- Input validation and XSS sanitization
- Sensitive data redaction in logs
- Secure token storage (expo-secure-store)

## Not Yet Implemented

- **Offline support**: Infrastructure exists (version columns, AsyncStorageService) but sync logic not active
- **Item editing modal**: Items can be toggled/deleted but no inline text editing
- **List descriptions**: Field exists in DB but not exposed in UI
- **Profile editing**: No UI to change display name or avatar
- **iOS support**: Build/config exists but focus has been Android
- **Notification tap handling**: Tapping a notification opens the app but doesn't navigate to the specific list
