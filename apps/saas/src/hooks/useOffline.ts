/**
 * useOffline Hook
 *
 * Detects online/offline state and provides offline features
 * Part of FASE 3.1 - Service Worker for Offline
 *
 * @example
 * const { isOnline, pendingActionsCount } = useOffline();
 */

import { useState, useEffect } from 'react';

interface OfflineAction {
  id: number;
  type: string;
  url: string;
  timestamp: number;
}

interface UseOfflineResult {
  isOnline: boolean;
  pendingActionsCount: number;
  pendingActions: OfflineAction[];
  syncPendingActions: () => Promise<void>;
}

export function useOffline(): UseOfflineResult {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  const OFFLINE_REQUESTS_DB = 'barberzap-offline-requests';

  const loadPendingActions = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');

      const actions = await new Promise<OfflineAction[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      setPendingActions(actions);
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_REQUESTS_DB, 1);

      request.onupgradeneeded = (event) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('requests')) {
          db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const syncPendingActions = async () => {
    if (!isOnline) {
      console.warn('[useOffline] Cannot sync while offline');
      return;
    }

    try {
      const db = await openDatabase();
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');

      const actions = [...pendingActions];
      const syncedIds: number[] = [];

      for (const action of actions) {
        try {
          const response = await fetch(action.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ offline: true, ...action }),
          });

          if (response.ok) {
            syncedIds.push(action.id);
            console.log(`[useOffline] Synced action: ${action.type}`);
          }
        } catch (error) {
          console.error(`[useOffline] Failed to sync ${action.type}:`, error);
        }
      }

      if (syncedIds.length > 0) {
        for (const id of syncedIds) {
          store.delete(id);
        }
        setPendingActions(prev => prev.filter(a => !syncedIds.includes(a.id)));
      }
    } catch (error) {
      console.error('[useOffline] Error syncing pending actions:', error);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      console.log('[useOffline] Online!');
      setIsOnline(true);
      loadPendingActions();
      syncPendingActions();
    };

    const handleOffline = () => {
      console.log('[useOffline] Offline!');
      setIsOnline(false);
      loadPendingActions();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    loadPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Auto-sync when coming back online
    if (isOnline) {
      loadPendingActions();
      syncPendingActions();
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingActionsCount: pendingActions.length,
    pendingActions,
    syncPendingActions
  };
}

/**
 * Hook to queue an action for offline sync
 */
export function useOfflineAction() {
  const [isQueuing, setIsQueuing] = useState(false);

  const queueOfflineAction = async (type: string, url: string, data: any) => {
    setIsQueuing(true);

    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('barberzap-offline-requests', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');

      await new Promise<void>((resolve, reject) => {
        const request = store.add({
          type,
          url,
          data,
          timestamp: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`[useOfflineAction] Queued action: ${type}`);
    } catch (error) {
      console.error('[useOfflineAction] Error queuing action:', error);
    } finally {
      setIsQueuing(false);
    }
  };

  return {
    queueOfflineAction,
    isQueuing
  };
}

/**
 * Hook for PWA install prompt
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Check if already installed (PWA)
    const checkInstalled = () => {
      const isStandalone =
        (window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('[usePWAInstall] No deferred prompt available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[usePWAInstall] User accepted install');
        setCanInstall(false);
      } else {
        console.log('[usePWAInstall] User dismissed install');
      }

      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[usePWAInstall] Error prompting install:', error);
      return false;
    }
  };

  return {
    canInstall,
    isInstalled,
    promptInstall
  };
}
