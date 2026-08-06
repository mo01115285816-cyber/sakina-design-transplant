import { DynamicIslandService } from './DynamicIslandService';

export class RadioMediaService {
  private static currentStationName: string = '';
  private static currentSubtitle: string = '';
  private static currentIsPlaying: boolean = false;
  private static cleanupFns: (() => void)[] = [];
  private static onPlay?: () => void;
  private static onPause?: () => void;

  static async init(
    audio: HTMLAudioElement, 
    stationName: string = 'إذاعة القرآن الكريم من القاهرة', 
    subtitle: string = 'البث المباشر', 
    logoUrl?: string,
    onPlay?: () => void,
    onPause?: () => void
  ) {
    this.currentStationName = stationName;
    this.currentSubtitle = subtitle;
    this.onPlay = onPlay;
    this.onPause = onPause;

    const absoluteLogoUrl = logoUrl ? (window.location.origin + logoUrl) : '';

    await DynamicIslandService.updateState({
      title: stationName, reciter: subtitle, contentType: 'radio', artworkUrl: absoluteLogoUrl,
      isPlaying: false, currentPositionMs: 0, durationMs: 0,
    });
    await DynamicIslandService.show();

    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];

    this.cleanupFns.push(DynamicIslandService.onPlayPause(() => {
      if (this.currentIsPlaying) {
        if (onPause) onPause(); else audio.pause();
        this.currentIsPlaying = false;
        this.updatePlaybackState('paused');
      } else {
        if (onPlay) onPlay(); else audio.play().catch(err => console.warn(err));
        this.currentIsPlaying = true;
        this.updatePlaybackState('playing');
      }
    }));
  }

  static async updatePlaybackState(state: 'playing' | 'paused' | 'none') {
    this.currentIsPlaying = state === 'playing';
    await DynamicIslandService.updateState({
      title: this.currentStationName, reciter: this.currentSubtitle, contentType: 'radio', artworkUrl: '',
      isPlaying: state === 'playing', currentPositionMs: 0, durationMs: 0,
    });
  }

  static destroy() {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    DynamicIslandService.hide();
  }
}
