// localStorage wrapper for mock data persistence
// This simulates database storage using browser localStorage

import { STORAGE_KEYS } from './config';

export class LocalStorage {
  // Generic get
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  }

  // Generic set
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  }

  // Generic remove
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }

  // Clear all QuickFuel data
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  // Get array from storage
  static getArray<T>(key: string, defaultValue: T[] = []): T[] {
    const data = this.get<T[]>(key);
    return data || defaultValue;
  }

  // Add item to array
  static addToArray<T extends { id: string }>(key: string, item: T): T {
    const items = this.getArray<T>(key);
    items.push(item);
    this.set(key, items);
    return item;
  }

  // Update item in array
  static updateInArray<T extends { id: string }>(
    key: string,
    id: string,
    updates: Partial<T>
  ): T | null {
    const items = this.getArray<T>(key);
    const index = items.findIndex((item) => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.set(key, items);
    return items[index];
  }

  // Delete item from array
  static deleteFromArray<T extends { id: string }>(key: string, id: string): boolean {
    const items = this.getArray<T>(key);
    const filtered = items.filter((item) => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    this.set(key, filtered);
    return true;
  }

  // Find item in array
  static findInArray<T extends { id: string }>(key: string, id: string): T | null {
    const items = this.getArray<T>(key);
    return items.find((item) => item.id === id) || null;
  }

  // Query items in array
  static queryArray<T>(
    key: string,
    predicate: (item: T) => boolean
  ): T[] {
    const items = this.getArray<T>(key);
    return items.filter(predicate);
  }
}
