/**
 * Safe storage utility that handles localStorage access errors gracefully
 * Falls back to in-memory storage when localStorage is not available
 */

interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class InMemoryStorage implements StorageInterface {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

class SafeAsyncStorage implements StorageInterface {
  private fallbackStorage = new InMemoryStorage();
  private useLocalStorage = true;

  constructor() {
    // Test localStorage availability
    this.testLocalStorage();
  }

  private testLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        this.useLocalStorage = true;
      } else {
        this.useLocalStorage = false;
      }
    } catch (error) {
      console.warn('localStorage not available, using in-memory storage:', error);
      this.useLocalStorage = false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.useLocalStorage && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      } else {
        return await this.fallbackStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`Failed to get item ${key} from localStorage, using fallback:`, error);
      this.useLocalStorage = false;
      return await this.fallbackStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.useLocalStorage && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        await this.fallbackStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to set item ${key} in localStorage, using fallback:`, error);
      this.useLocalStorage = false;
      await this.fallbackStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.useLocalStorage && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        await this.fallbackStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Failed to remove item ${key} from localStorage, using fallback:`, error);
      this.useLocalStorage = false;
      await this.fallbackStorage.removeItem(key);
    }
  }
}

// Create a singleton instance
export const safeStorage = new SafeAsyncStorage();

// Export for compatibility with AsyncStorage interface
export default {
  getItem: (key: string) => safeStorage.getItem(key),
  setItem: (key: string, value: string) => safeStorage.setItem(key, value),
  removeItem: (key: string) => safeStorage.removeItem(key),
};
