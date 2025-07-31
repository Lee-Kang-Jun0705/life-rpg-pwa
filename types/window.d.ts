interface WorkboxEvent extends Event {
  type: string;
  target?: EventTarget | null;
  isUpdate?: boolean;
}

interface Workbox {
  addEventListener(type: 'waiting' | 'controlling' | 'activated', listener: (event: WorkboxEvent) => void): void;
  removeEventListener(type: string, listener: (event: WorkboxEvent) => void): void;
  register(): Promise<void>;
  messageSkipWaiting(): void;
  update(): Promise<void>;
}

interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface Window {
  workbox: Workbox;
  visibilityManager?: {
    isVisible: (element: HTMLElement) => boolean;
    checkVisibility: () => void;
  };
}