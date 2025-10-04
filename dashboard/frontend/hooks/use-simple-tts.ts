import { useState, useCallback, useRef } from 'react';

export function useSimpleTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.8);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
    // Update current playing audio volume if any
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = vol * 0.9;
    }
  }, []);

  const speak = useCallback(async (text: string): Promise<number> => {
    const start = Date.now();
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
        // Ignore pause errors
      }
      currentAudioRef.current = null;
    }
    
    setIsSpeaking(true);

    try {
      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      console.log('[TTS] Speaking:', text, 'at volume:', currentVolume);
      
      // Alexandra voice - super soft with optimal slowness settings
      const audio = new Audio(
        `${apiUrl}/api/audio/tts/stream?text=${encodeURIComponent(text)}&voice_id=kdmDKE6EkgrWrrykO9Qt&stability=0.97&similarity_boost=0.65`
      );
      audio.volume = currentVolume * 0.9; // Use current volume, slightly quieter for softer feel
      audio.playbackRate = 0.94; // 10% slower for calmer, soothing delivery
      audio.preload = 'auto';
      
      // Store reference to current audio
      currentAudioRef.current = audio;

      // Wait for it to end
      await new Promise<void>((resolve) => {
        let playPromise: Promise<void> | null = null;
        
        audio.onended = () => {
          console.log('[TTS] Finished:', text);
          setIsSpeaking(false);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          resolve();
        };
        audio.onerror = (e) => {
          console.error('[TTS] Audio error - likely rate limit or network issue. Failing silently.');
          setIsSpeaking(false);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          resolve();
        };
        
        // Handle play promise properly
        playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Only log if it's not an AbortError (interrupted by pause)
            if (err.name !== 'AbortError') {
              console.error('[TTS] Play error:', err);
            }
            setIsSpeaking(false);
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
            resolve();
          });
        }
      });

      return Date.now() - start;
    } catch (error) {
      console.error('[TTS] Exception:', error);
      setIsSpeaking(false);
      currentAudioRef.current = null;
      return 0;
    }
  }, [currentVolume]);

  const stop = useCallback(() => {
    // Actually stop the audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
        // Ignore pause errors (e.g., if audio hasn't started playing yet)
      }
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, setVolume };
}

