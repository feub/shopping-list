// Input sanitization utilities to prevent XSS and other attacks

export const sanitizeText = (text: string): string => {
  // Remove potential XSS vectors
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Enforce max length
};

export const sanitizeListName = (name: string): string => {
  return name
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 100);
};

export const sanitizeDisplayName = (name: string): string => {
  return name
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 50);
};

export const sanitizeNotes = (notes: string): string => {
  return notes
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 1000);
};

// For database queries - prevent SQL injection (though Supabase handles this)
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/['";\\]/g, '') // Remove SQL special characters
    .substring(0, 100);
};
