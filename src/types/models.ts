// Application data models

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  version: number;
  last_synced_at: string | null;
}

export interface ListMember {
  id: string;
  list_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'owner';
  added_at: string;
}

export interface Item {
  id: string;
  listId: string;
  text: string;
  isBought: boolean;
  orderIndex: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  quantity?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface SavedList {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at: string | null;
}

export interface SavedListItem {
  id: string;
  saved_list_id: string;
  text: string;
  order_index: number;
  notes: string | null;
  quantity: number;
  created_at: string;
}

// Helper types for creating new records
export type CreateItem = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'version' | 'last_synced_at' | 'created_by'> & {
  id?: string;
};

export type CreateList = Omit<List, 'id' | 'created_at' | 'updated_at' | 'version' | 'last_synced_at' | 'created_by' | 'is_archived'> & {
  id?: string;
};

export type CreateSavedList = Omit<SavedList, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at' | 'created_by'> & {
  id?: string;
};

export type CreateSavedListItem = Omit<SavedListItem, 'id' | 'created_at'> & {
  id?: string;
};

// Update types
export type UpdateItem = Partial<Omit<Item, 'id' | 'list_id' | 'created_at' | 'created_by'>>;
export type UpdateList = Partial<Omit<List, 'id' | 'created_at' | 'created_by'>>;
export type UpdateSavedList = Partial<Omit<SavedList, 'id' | 'created_at' | 'created_by'>>;
