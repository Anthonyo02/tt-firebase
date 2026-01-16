import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erreur lecture localStorage pour ${key}`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const stringified = JSON.stringify(valueToStore);
      window.localStorage.setItem(key, stringified);

      // 🔥 Déclenche manuellement l'event dans CET onglet aussi
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: stringified,
        storageArea: window.localStorage,
      }));
    } catch (error) {
      console.error(`Erreur écriture localStorage pour ${key}`, error);
    }
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (e) {
          console.warn(`Erreur parsing localStorage ${key}`, e);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;