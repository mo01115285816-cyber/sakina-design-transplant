export class MediaSession {
  static async setMetadata(metadata: { 
    title: string; 
    artist: string; 
    album?: string; 
    artwork?: Array<{ src: string; sizes?: string; type?: string }> 
  }) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album || 'سَكِينَة',
          artwork: metadata.artwork || []
        });
      } catch (e) {
        console.warn('MediaSession setMetadata failed:', e);
      }
    }
  }

  static async setActionHandler(
    options: { action: 'play' | 'pause' | 'stop' | 'nexttrack' | 'previoustrack' }, 
    handler: (() => void) | null
  ) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        // Handle stop mapped to null if not supported or pass directly
        navigator.mediaSession.setActionHandler(options.action as MediaSessionAction, handler);
      } catch (e) {
        console.warn(`MediaSession setActionHandler failed for ${options.action}:`, e);
      }
    }
  }

  static async setPlaybackState(options: { playbackState: 'playing' | 'paused' | 'none' }) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        // HTML5 MediaSession playbackState accepts 'playing' | 'paused' | 'none'
        navigator.mediaSession.playbackState = options.playbackState;
      } catch (e) {
        console.warn('MediaSession setPlaybackState failed:', e);
      }
    }
  }
}
