import { useState, useCallback, useRef } from 'react';

export function useSimpleTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.8);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = vol * 0.9;
    }
  }, []);

  const processNextInQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) {
      if (speechQueueRef.current.length === 0) {
        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
      }
      return;
    }

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    const text = speechQueueRef.current.shift()!;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const audio = await createAudioWithFallback(apiUrl, text, currentVolume);
      
      currentAudioRef.current = audio;

      await new Promise<void>((resolve) => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        };
        
        timeoutId = setTimeout(() => {
          console.warn('[TTS] Timeout after 15 seconds for:', text);
          cleanup();
          resolve();
        }, 15000);
        
        audio.onended = () => {
          cleanup();
          resolve();
        };
        
        audio.onerror = (e) => {
          console.error('[TTS] Audio error:', e);
          cleanup();
          resolve();
        };
        
        const playAudio = async () => {
          try {
            await audio.play();
          } catch (playError) {
            console.error('[TTS] ❌ Play error:', playError);
            try {
              await new Promise<void>((resolveReady, rejectReady) => {
                const onCanPlay = () => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  resolveReady();
                };
                const onError = (e: any) => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  rejectReady(e);
                };
                audio.addEventListener('canplay', onCanPlay);
                audio.addEventListener('error', onError);
                
                setTimeout(() => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  rejectReady(new Error('Timeout waiting for canplay'));
                }, 3000);
              });
              
              await audio.play();
            } catch (retryError) {
              console.error('[TTS] ❌ Retry failed:', retryError);
              cleanup();
              resolve();
            }
          }
        };
        
        playAudio();
      });
    } catch (error) {
      console.error('[TTS] Exception:', error);
      currentAudioRef.current = null;
    }

    isProcessingQueueRef.current = false;

    processNextInQueue();
  }, [currentVolume]);

  const speak = useCallback(async (text: string): Promise<number> => {
    const start = Date.now();
    
    
    speechQueueRef.current.push(text);
    
    if (!isProcessingQueueRef.current) {
      processNextInQueue();
    }

    return Date.now() - start;
  }, [processNextInQueue]);

  const createAudioWithFallback = async (apiUrl: string, text: string, volume: number): Promise<HTMLAudioElement> => {
    const streamingUrl = `${apiUrl}/api/audio/tts/stream?text=${encodeURIComponent(text)}&voice_id=Fahco4VZzobUeiPqni1S&stability=0.97&similarity_boost=0.65`;
    
    const audio = new Audio(streamingUrl);
    audio.volume = volume * 0.9;
    audio.playbackRate = 0.94;
    audio.preload = 'auto';
    
    audio.load();
    
    return audio;
  };

  const stop = useCallback(() => {
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
      }
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, setVolume };
}

