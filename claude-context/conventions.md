# Conventions

## Code Style

- **TypeScript strict mode** throughout the codebase
- **Functional components** with React hooks (no class components)
- **Named exports** for components and services (`export const ListScreen`, `export class ItemsService`)
- **Static methods** on service classes (`ItemsService.createItem()`) - no instantiation needed

## Naming

- **Files**: PascalCase for components/screens (`ListItem.tsx`), camelCase for hooks/utils (`useList.ts`, `validation.ts`)
- **Components**: PascalCase (`AddItemInput`, `DraggableList`)
- **Hooks**: `use` prefix, camelCase (`useList`, `useTheme`, `useAuth`)
- **Services**: PascalCase class name with `Service` suffix (`ItemsService`, `ListsService`)
- **Database columns**: snake_case (`is_bought`, `order_index`, `created_by`)
- **TypeScript interfaces/types**: PascalCase (`Item`, `List`, `CreateItemData`)
- **App model fields**: camelCase (`isBought`, `orderIndex`, `createdBy`)

## Field Mapping

Database columns (snake_case) are mapped to app models (camelCase) in service methods or hooks:
```typescript
// In useList.ts
const mapped: Item = {
  id: item.id,
  isBought: item.is_bought,
  orderIndex: item.order_index,
  isImportant: item.is_important || false,
  // ...
};
```

## Component Patterns

- **Screen components** receive navigation props typed with `MainTabScreenProps<'ScreenName'>`
- **Modal components** receive `visible`, `onClose`, and relevant data props
- **List item components** receive `item` object plus callback props (`onToggle`, `onDelete`, etc.)
- **Styles** use `StyleSheet.create()` at file bottom, with dynamic theme values applied inline

## Theming

- Always use `theme.colors.*`, `theme.fontSizes.*`, `theme.spacing.*` from `useTheme()`
- Never hardcode colors in components (except pure white `#FFFFFF` for badges)
- Theme colors:
  - `primary`: burnt orange (#C07A30)
  - `warning`: amber (#E5AD5E) - used for important items
  - `success`/`checked`: olive (#8B8C3C) - used for bought items
  - `error`: coral red (#C24B3A)

## Error Handling

- Services return `{ data, error }` tuples (Supabase pattern)
- Components use try/catch and log errors via `Logger`
- Push notifications are fire-and-forget (errors logged, never thrown or shown to user)
- Sensitive data is automatically redacted by `Logger` (password, token, email, etc.)

## Input Validation

- All user text input is validated (`validateItemText`, `validateListName`, etc.) and sanitized (`sanitizeText`, `sanitizeListName`) before being sent to the database
- Validation happens in service methods, not in components

## State Management

- **AuthContext** for auth state (user, session)
- **ThemeContext** for theme preferences (persisted to AsyncStorage)
- **useList hook** for list items state (fetching, CRUD, real-time)
- **Local useState** for UI-specific state in screens/components
- **AsyncStorage** for persisting default list ID
- **No global state library used actively** (zustand is installed but not used)

## Database Interaction

- All DB access goes through service classes in `src/services/supabase/`
- Never call `supabase.from()` directly in components or hooks (except useList's realtime subscription)
- RPC functions used when RLS creates circular dependencies
- List creation always uses `create_list_with_owner` RPC

## Git & Build

- Main branch: `main`
- Development builds (not Expo Go) required for push notifications
- `google-services.json` needed at `android/app/` for FCM
- Build: `npx expo run:android`
- APK output: `android/app/build/outputs/apk/debug/app-debug.apk`
