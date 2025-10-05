import { useState, useCallback, useRef } from 'react';

export function useSimpleTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.8);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Queue system for sequential TTS playback
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
    // Update current playing audio volume if any
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = vol * 0.9;
    }
  }, []);

  // Process the next item in the speech queue
  const processNextInQueue = useCallback(async () => {
    // If already processing or queue is empty, return
    if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) {
      if (speechQueueRef.current.length === 0) {
        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
      }
      return;
    }

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    // Get next text from queue
    const text = speechQueueRef.current.shift()!;
    console.log('[TTS Queue] Processing:', text, '| Queue remaining:', speechQueueRef.current.length);

    try {
      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Try streaming first, then fallback to non-streaming
      const audio = await createAudioWithFallback(apiUrl, text, currentVolume);
      
      // Store reference to current audio
      currentAudioRef.current = audio;

      // Wait for it to end (with 15-second timeout)
      await new Promise<void>((resolve) => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        };
        
        // 15-second timeout to prevent infinite hangs
        timeoutId = setTimeout(() => {
          console.warn('[TTS] Timeout after 15 seconds for:', text);
          cleanup();
          resolve();
        }, 15000);
        
        audio.onended = () => {
          console.log('[TTS] Finished:', text);
          cleanup();
          resolve();
        };
        
        audio.onerror = (e) => {
          console.error('[TTS] Audio error:', e);
          cleanup();
          resolve();
        };
        
        // Wait for audio to be ready before playing
        const playAudio = async () => {
          try {
            // Wait for audio to be ready
            if (audio.readyState < 2) { // HAVE_CURRENT_DATA
              await new Promise<void>((resolveReady) => {
                const onCanPlay = () => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  resolveReady();
                };
                const onError = () => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  resolveReady();
                };
                audio.addEventListener('canplay', onCanPlay);
                audio.addEventListener('error', onError);
                
                // Timeout for loading
                setTimeout(() => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  resolveReady();
                }, 5000);
              });
            }
            
            // Play the audio
            await audio.play();
          } catch (playError) {
            console.error('[TTS] Play error:', playError);
            cleanup();
            resolve();
          }
        };
        
        playAudio();
      });
    } catch (error) {
      console.error('[TTS] Exception:', error);
      currentAudioRef.current = null;
    }

    // Mark as done processing this item
    isProcessingQueueRef.current = false;

    // Process next item in queue (recursive)
    processNextInQueue();
  }, [currentVolume]);

  const speak = useCallback(async (text: string): Promise<number> => {
    const start = Date.now();
    
    console.log('[TTS Queue] Adding to queue:', text);
    
    // Add to queue
    speechQueueRef.current.push(text);
    
    // Start processing if not already processing
    if (!isProcessingQueueRef.current) {
      processNextInQueue();
    }

    return Date.now() - start;
  }, [processNextInQueue]);

  // Helper function to create audio with fallback
  const createAudioWithFallback = async (apiUrl: string, text: string, volume: number): Promise<HTMLAudioElement> => {
    // First try streaming endpoint - using Fahco4VZzobUeiPqni1S voice
    const streamingUrl = `${apiUrl}/api/audio/tts/stream?text=${encodeURIComponent(text)}&voice_id=Fahco4VZzobUeiPqni1S&stability=0.97&similarity_boost=0.65`;
    
    try {
      const audio = new Audio(streamingUrl);
      audio.volume = volume * 0.9;
      audio.playbackRate = 0.94;
      audio.preload = 'auto';
      
      // Test if the streaming URL works
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Streaming timeout'));
        }, 3000);
        
        audio.oncanplay = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        audio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Streaming failed'));
        };
        
        // Start loading
        audio.load();
      });
      
      return audio;
    } catch (streamingError) {
      console.warn('[TTS] Streaming failed, trying non-streaming endpoint:', streamingError);
      
      // Fallback to non-streaming endpoint
      try {
        const response = await fetch(`${apiUrl}/api/audio/tts/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice_id: 'Fahco4VZzobUeiPqni1S',
            output_format: 'mp3_44100_128'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.audio?.data) {
          throw new Error('TTS conversion failed: ' + (result.error || 'Unknown error'));
        }
        
        // Create audio from base64 data
        const audio = new Audio(`data:audio/mp3;base64,${result.audio.data}`);
        audio.volume = volume * 0.9;
        audio.playbackRate = 0.94;
        audio.preload = 'auto';
        
        return audio;
      } catch (fallbackError) {
        console.error('[TTS] Both streaming and fallback failed:', fallbackError);
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        throw new Error(`TTS failed: ${errorMessage}`);
      }
    }
  };

  const stop = useCallback(() => {
    // Clear the queue
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    // Stop current audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
        // Ignore pause errors (e.g., if audio hasn't started playing yet)
      }
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
    console.log('[TTS Queue] Stopped and cleared queue');
  }, []);

  return { speak, stop, isSpeaking, setVolume };
}

