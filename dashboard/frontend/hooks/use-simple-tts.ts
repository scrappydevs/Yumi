import { useState, useCallback } from 'react';

export function useSimpleTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.8);

  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
  }, []);

  const speak = useCallback(async (text: string, volume: number = 0.8): Promise<number> => {
    const start = Date.now();
    setIsSpeaking(true);

    try {
      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      console.log('[TTS] Speaking:', text);
      
      // Alexandra voice - super soft with optimal slowness settings
      const audio = new Audio(
        `${apiUrl}/api/audio/tts/stream?text=${encodeURIComponent(text)}&voice_id=kdmDKE6EkgrWrrykO9Qt&stability=0.97&similarity_boost=0.65`
      );
      audio.volume = volume * 0.9; // Slightly quieter for softer feel
      audio.playbackRate = 0.94; // 10% slower for calmer, soothing delivery
      audio.preload = 'auto';

      // Wait for it to end
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          console.log('[TTS] Finished:', text);
          setIsSpeaking(false);
          resolve();
        };
        audio.onerror = (e) => {
          console.error('[TTS] Error:', e);
          setIsSpeaking(false);
          resolve();
        };
        audio.play().catch((err) => {
          console.error('[TTS] Play error:', err);
          setIsSpeaking(false);
          resolve();
        });
      });

      return Date.now() - start;
    } catch (error) {
      console.error('[TTS] Exception:', error);
      setIsSpeaking(false);
      return 0;
    }
  }, []);

  const stop = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, setVolume };
}

