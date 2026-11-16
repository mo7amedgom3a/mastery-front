/**
 * Storage adapter for the mock labs database. The browser uses localStorage; tests and the
 * server render use an in-memory map. A quota/security error falls back to memory so a lab can
 * still run in private mode without losing the current session.
 */
export type LabStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly kind: "local" | "memory";
};

export function createMemoryStorage(seed: Record<string, string> = {}): LabStorage {
  const values = new Map<string, string>(Object.entries(seed));
  return {
    kind: "memory",
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let fallback: LabStorage | null = null;

/**
 * localStorage when available, otherwise a process-lifetime memory store. Writes that throw
 * (quota, disabled storage) switch the whole adapter to memory for the rest of the page.
 */
export function createBrowserStorage(scope: StorageLike | null = browserLocalStorage()): LabStorage {
  if (!scope) {
    fallback ??= createMemoryStorage();
    return fallback;
  }

  const memory = createMemoryStorage();
  let useMemory = false;
  const asMemory = () => {
    useMemory = true;
    return memory;
  };

  return {
    kind: "local",
    getItem(key) {
      if (useMemory) return memory.getItem(key);
      try {
        return scope.getItem(key);
      } catch {
        return asMemory().getItem(key);
      }
    },
    setItem(key, value) {
      if (useMemory) {
        memory.setItem(key, value);
        return;
      }
      try {
        scope.setItem(key, value);
      } catch {
        asMemory().setItem(key, value);
      }
    },
    removeItem(key) {
      if (useMemory) {
        memory.removeItem(key);
        return;
      }
      try {
        scope.removeItem(key);
      } catch {
        asMemory().removeItem(key);
      }
    },
  };
}

/** A stable storage key for the mock DB. Keep the version in the name for clean resets. */
export const LABS_DB_KEY = "ma-labs-api-v1";
/** The legacy Zustand store, imported once by the mock migration. */
export const LEGACY_LABS_KEY = "ma-labs";
