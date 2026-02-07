// Input validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return true;
};

export const validatePassword = (password: string): boolean => {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  // Optional: Add more password requirements
  // if (!/[A-Z]/.test(password)) {
  //   throw new Error('Password must contain at least one uppercase letter');
  // }
  return true;
};

export const validateItemText = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    throw new Error('Item text cannot be empty');
  }
  if (text.length > 500) {
    throw new Error('Item text too long (max 500 characters)');
  }
  return true;
};

export const validateListName = (name: string): boolean => {
  if (!name || name.trim().length === 0) {
    throw new Error('List name cannot be empty');
  }
  if (name.length > 100) {
    throw new Error('List name too long (max 100 characters)');
  }
  return true;
};

export const validateQuantity = (quantity: number): boolean => {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  if (quantity > 999) {
    throw new Error('Quantity too large (max 999)');
  }
  return true;
};
