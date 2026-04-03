// src/services/pwaIntegration.ts - PWA integration service

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAUpdateInfo {
  available: boolean;
  version?: string;
  changelog?: string[];
}

export class PWAIntegrationService {
  private installPromptEvent: Event | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private onUpdateAvailable: ((info: PWAUpdateInfo) => void) | null = null;

  constructor() {
    this.initializeServiceWorker();
    this.setupInstallPrompt();
    this.setupUpdateDetection();
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      console.log('PWA install prompt available');
    });
  }

  /**
   * Setup update detection
   */
  private setupUpdateDetection(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.onUpdateAvailable) {
          this.onUpdateAvailable({
            available: true,
            version: this.serviceWorkerRegistration?.active?.scriptURL
          });
        }
      });
    }
  }

  /**
   * Check if PWA installation is available
   */
  public isInstallAvailable(): boolean {
    return this.installPromptEvent !== null;
  }

  /**
   * Prompt user to install PWA
   */
  public async promptInstall(): Promise<void> {
    if (!this.installPromptEvent) {
      throw new Error('Install prompt not available');
    }

    const promptEvent = this.installPromptEvent as any;
    await promptEvent.prompt();
    
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.installPromptEvent = null;
    } else {
      console.log('User dismissed the install prompt');
    }
  }

  /**
   * Check for updates
   */
  public async checkForUpdates(): Promise<PWAUpdateInfo> {
    if (!this.serviceWorkerRegistration) {
      return { available: false };
    }

    try {
      const registration = await this.serviceWorkerRegistration.update();
      
      if (registration.installing) {
        return {
          available: true,
          version: registration.installing.scriptURL,
          changelog: ['New version available', 'Improved performance', 'Bug fixes']
        };
      }

      return { available: false };
    } catch (error) {
      console.error('Update check failed:', error);
      return { available: false };
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  public async skipWaiting(): Promise<void> {
    if (!this.serviceWorkerRegistration?.waiting) {
      return;
    }

    this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Setup offline data synchronization
   */
  public async syncOfflineData(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.log('Background Sync not supported');
      return;
    }

    try {
      await this.serviceWorkerRegistration?.sync.register('sync-offline-data');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  /**
   * Request push notifications permission
   */
  public async requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    return await subscription.unsubscribe();
  }

  /**
   * Check if running as PWA
   */
  public isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  /**
   * Get PWA installation status
   */
  public getInstallationStatus(): {
    isInstalled: boolean;
    isInstallAvailable: boolean;
    canSyncOffline: boolean;
    canReceivePush: boolean;
  } {
    return {
      isInstalled: this.isRunningAsPWA(),
      isInstallAvailable: this.isInstallAvailable(),
      canSyncOffline: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      canReceivePush: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  /**
   * Set update available callback
   */
  public setOnUpdateAvailableCallback(callback: (info: PWAUpdateInfo) => void): void {
    this.onUpdateAvailable = callback;
  }

  /**
   * Clear update available callback
   */
  public clearUpdateAvailableCallback(): void {
    this.onUpdateAvailable = null;
  }

  /**
   * Utility function to convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Cleanup service worker
   */
  public async cleanup(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  }
}

// Utility function to create PWA integration service
export const createPWAIntegrationService = (): PWAIntegrationService => {
  return new PWAIntegrationService();
}

export default PWAIntegrationService