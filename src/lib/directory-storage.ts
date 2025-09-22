// Directory handle storage using IndexedDB for File System Access API
// Phase 4.1: Enhanced auto-save with folder selection

import { log } from './logger';

const DB_NAME = 'darkcanvas-storage';
const DB_VERSION = 1;
const STORE_NAME = 'directory-handles';
const HANDLE_KEY = 'selected-directory';

// Type for directory metadata stored alongside handle
export interface DirectoryMetadata {
  name: string;
  lastUsed: Date;
  permissionState?: PermissionState;
}

/**
 * Open or create the IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save a directory handle to IndexedDB
 */
export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  try {
    const db = await openDB();

    const metadata: DirectoryMetadata = {
      name: handle.name,
      lastUsed: new Date(),
      permissionState: await handle.queryPermission({ mode: 'readwrite' })
    };

    // Save handle in first transaction
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });

    // Save metadata in second transaction
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(metadata, `${HANDLE_KEY}-metadata`);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });

    log.info('Directory handle saved successfully', {
      name: handle.name,
      permission: metadata.permissionState
    });
  } catch (error) {
    log.error('Failed to save directory handle', { error });
    throw error;
  }
}

/**
 * Retrieve the saved directory handle from IndexedDB
 */
export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Failed to retrieve directory handle', { error });
    return null;
  }
}

/**
 * Retrieve directory metadata
 */
export async function getDirectoryMetadata(): Promise<DirectoryMetadata | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(`${HANDLE_KEY}-metadata`);
      request.onsuccess = () => {
        const metadata = request.result;
        if (metadata) {
          // Convert date string back to Date object
          metadata.lastUsed = new Date(metadata.lastUsed);
        }
        resolve(metadata || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Failed to retrieve directory metadata', { error });
    return null;
  }
}

/**
 * Check permission state for the saved directory handle
 */
export async function checkDirectoryPermission(): Promise<PermissionState | null> {
  try {
    const handle = await getDirectoryHandle();
    if (!handle) {
      return null;
    }

    const permission = await handle.queryPermission({ mode: 'readwrite' });
    log.info('Directory permission checked', { permission, name: handle.name });
    return permission;
  } catch (error) {
    log.error('Failed to check directory permission', { error });
    return null;
  }
}

/**
 * Request permission for the saved directory handle
 */
export async function requestDirectoryPermission(): Promise<PermissionState | null> {
  try {
    const handle = await getDirectoryHandle();
    if (!handle) {
      return null;
    }

    const permission = await handle.requestPermission({ mode: 'readwrite' });
    log.info('Directory permission requested', { permission, name: handle.name });
    return permission;
  } catch (error) {
    log.error('Failed to request directory permission', { error });
    return null;
  }
}

/**
 * Clear the saved directory handle (when user wants to change location)
 */
export async function clearDirectoryHandle(): Promise<void> {
  try {
    const db = await openDB();

    // Delete handle in first transaction
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });

    // Delete metadata in second transaction
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(`${HANDLE_KEY}-metadata`);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });

    log.info('Directory handle cleared successfully');
  } catch (error) {
    log.error('Failed to clear directory handle', { error });
    throw error;
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window;
}