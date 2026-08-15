import { DynamicIslandService } from './DynamicIslandService';
import { publicAssetUrl } from '@/utils/publicAssetUrl';

export class QuranMediaService {
  private static currentReciterName: string = '';
  private static currentSurahName: string = '';
  private static currentIsPlaying: boolean = false;
  private static cleanupFns: (() => void)[] = [];
  private static onPlay?: () => void;
  private static onPause?: () => void;
  private static onNext?: () => void;
  private static onPrev?: () => void;

  static async init(
    audio: HTMLAudioElement, 
    reciterName: string, 
    surahName: string,
    onPlay?: () => void,
    onPause?: () => void,
    onNext?: () => void,
    onPrev?: () => void
  ) {
    this.currentReciterName = reciterName;
    this.currentSurahName = surahName;
    this.onPlay = onPlay;
    this.onPause = onPause;
    this.onNext = onNext;
    this.onPrev = onPrev;

    const artworkUrl = publicAssetUrl('images/quran_artwork.jpg');

    await DynamicIslandService.updateState({
      title: surahName, reciter: reciterName, contentType: 'quran', artworkUrl: artworkUrl,
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

    this.cleanupFns.push(DynamicIslandService.onNext(() => {
      if (onNext) onNext(); else window.dispatchEvent(new CustomEvent('play-next-surah'));
    }));

    this.cleanupFns.push(DynamicIslandService.onPrev(() => {
      if (onPrev) onPrev(); else window.dispatchEvent(new CustomEvent('play-prev-surah'));
    }));
  }

  static async updatePlaybackState(state: 'playing' | 'paused' | 'none') {
    this.currentIsPlaying = state === 'playing';
    const artworkUrl = publicAssetUrl('images/quran_artwork.jpg');
    await DynamicIslandService.updateState({
      title: this.currentSurahName, reciter: this.currentReciterName, contentType: 'quran', artworkUrl: artworkUrl,
      isPlaying: state === 'playing', currentPositionMs: 0, durationMs: 0,
    });
  }

  static destroy() {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    DynamicIslandService.hide();
  }
}
