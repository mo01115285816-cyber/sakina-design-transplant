const AUDIO_CACHE_NAME = 'quran-audio-cache-v1';

export async function downloadAudioFile(url: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    await cache.put(url, response);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function isAudioDownloaded(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(url);
    return !!response;
  } catch (error) {
    return false;
  }
}

export async function getAudioUrl(url: string): Promise<string> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Error getting cached audio:', error);
  }
  return url;
}

export async function removeAudioFile(url: string): Promise<void> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.delete(url);
  } catch (error) {
    console.error('Error removing cached audio:', error);
  }
}
