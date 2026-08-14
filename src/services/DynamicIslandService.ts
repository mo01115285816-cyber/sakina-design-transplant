import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeDynamicIsland = registerPlugin<Record<string, (args: Record<string, unknown>) => Promise<unknown>>>("DynamicIsland");

type ContentType = 'quran' | 'radio';

interface DynamicIslandState {
  title: string;
  reciter: string;
  contentType: ContentType;
  artworkUrl: string;
  isPlaying: boolean;
  currentPositionMs: number;
  durationMs: number;
}

type BridgeEventCallback = () => void;
type BridgeSeekCallback = (positionMs: number) => void;

class DynamicIslandServiceImpl {
  private isNative: boolean;
  private plugin: any = null;
  private listeners: { playPause: BridgeEventCallback[]; next: BridgeEventCallback[]; prev: BridgeEventCallback[]; seek: BridgeSeekCallback[] } = { playPause: [], next: [], prev: [], seek: [] };
  private listenerHandles: { remove: () => void }[] = [];

  constructor() {
    this.isNative = this.checkNative();
    if (this.isNative) this.initPlugin();
  }

  private checkNative(): boolean {
    try { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'; } catch { return false; }
  }

  private async initPlugin() {
    try {
      this.plugin = (window as any).DynamicIsland || null;
      if (!this.plugin) {
        const Plugins = await import('@capacitor/core').then(m => (window as any).Capacitor?.Plugins);
        this.plugin = Plugins?.DynamicIsland || null;
      }
    } catch (e) { console.warn('DynamicIsland plugin not available:', e); }
  }

  private callPlugin(method: string, args: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.plugin && typeof this.plugin[method] === 'function') this.plugin[method](args).then(resolve).catch(reject);
        else {
          const nativeMethod = NativeDynamicIsland[method];
          if (!nativeMethod) throw new Error(`DynamicIsland method not found: ${method}`);
          nativeMethod(args).then(resolve).catch(reject);
        }
      } catch (e) { reject(e); }
    });
  }

  async show(): Promise<void> { if (!this.isNative) return; try { await this.callPlugin('show'); } catch (e) { console.warn('DynamicIsland.show failed:', e); } }
  async hide(): Promise<void> { if (!this.isNative) return; try { await this.callPlugin('hide'); } catch (e) { console.warn('DynamicIsland.hide failed:', e); } }

  async updateState(state: DynamicIslandState): Promise<void> {
    if (!this.isNative) return;
    try {
      await this.callPlugin('updateState', {
        title: state.title, reciter: state.reciter, contentType: state.contentType, artworkUrl: state.artworkUrl,
        isPlaying: state.isPlaying, currentPositionMs: Math.round(state.currentPositionMs), durationMs: Math.round(state.durationMs),
      });
    } catch (e) { console.warn('DynamicIsland.updateState failed:', e); }
  }

  async requestOverlayPermission(): Promise<boolean> {
    if (!this.isNative) return false;
    try { const result = await this.callPlugin('requestOverlayPermission'); return result?.granted ?? false; } catch { return false; }
  }

  async checkOverlayPermission(): Promise<boolean> {
    if (!this.isNative) return false;
    try { const result = await this.callPlugin('checkOverlayPermission'); return result?.granted ?? false; } catch { return false; }
  }

  onPlayPause(callback: BridgeEventCallback): () => void {
    this.listeners.playPause.push(callback);
    const remove = this.addNativeListener('playPause', callback);
    return () => { this.listeners.playPause = this.listeners.playPause.filter(cb => cb !== callback); remove(); };
  }

  onNext(callback: BridgeEventCallback): () => void {
    this.listeners.next.push(callback);
    const remove = this.addNativeListener('next', callback);
    return () => { this.listeners.next = this.listeners.next.filter(cb => cb !== callback); remove(); };
  }

  onPrev(callback: BridgeEventCallback): () => void {
    this.listeners.prev.push(callback);
    const remove = this.addNativeListener('prev', callback);
    return () => { this.listeners.prev = this.listeners.prev.filter(cb => cb !== callback); remove(); };
  }

  onSeek(callback: BridgeSeekCallback): () => void {
    this.listeners.seek.push(callback);
    const remove = this.addNativeListener('seek', (data: any) => { callback(data?.positionMs ?? 0); });
    return () => { this.listeners.seek = this.listeners.seek.filter(cb => cb !== callback); remove(); };
  }

  private addNativeListener(eventName: string, callback: (...args: any[]) => void): () => void {
    if (!this.isNative) return () => {};
    try {
      if (this.plugin && typeof this.plugin.addListener === 'function') {
        const handle = this.plugin.addListener(eventName, callback);
        this.listenerHandles.push(handle);
        return () => handle.remove();
      }
      const handle = Capacitor.addListener('DynamicIsland', eventName, callback);
      this.listenerHandles.push(handle);
      return () => handle.remove();
    } catch { return () => {}; }
  }

  destroy() {
    this.listenerHandles.forEach(h => { try { h.remove(); } catch {} });
    this.listenerHandles = [];
    this.listeners = { playPause: [], next: [], prev: [], seek: [] };
  }
}

export const DynamicIslandService = new DynamicIslandServiceImpl();
