import { useState, useCallback } from 'react';

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const audioUrl = `http://localhost:8000/api/audio/tts/stream?text=${encodeURIComponent(text)}&voice_id=Fahco4VZzobUeiPqni1S&stability=0.97&similarity_boost=0.65`;
      
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        setIsSpeaking(false);
      };
      
      audio.onloadstart = () => {
      };
      
      audio.oncanplay = () => {
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Voice output error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [audioElement]);

  return { speak, stop, isSpeaking };
}

