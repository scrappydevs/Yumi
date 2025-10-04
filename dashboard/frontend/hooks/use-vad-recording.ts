/**
 * VAD (Voice Activity Detection) Recording Hook
 * 
 * Uses MediaRecorder to capture audio and analyzes it with backend VAD service
 * to automatically stop recording when speech ends (silence detected).
 * 
 * Features:
 * - Real-time audio recording
 * - Automatic silence detection via VAD
 * - Auto-stop after configurable silence duration
 * - Whisper transcription integration
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface VADRecordingOptions {
  /** Duration of silence (in ms) before auto-stopping */
  silenceThreshold?: number;
  /** Interval (in ms) for checking VAD score */
  checkInterval?: number;
  /** VAD score threshold for considering audio as speech (0.0-1.0) */
  speechThreshold?: number;
  /** Callback when transcription completes */
  onTranscriptionComplete?: (text: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface VADRecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  transcription: string;
  error: string | null;
  vadScore: number;
  isSpeechDetected: boolean;
}

export function useVADRecording({
  silenceThreshold = 2500, // 2.5 seconds of silence
  checkInterval = 1000, // Check every 1 second
  speechThreshold = 0.5,
  onTranscriptionComplete,
  onError,
}: VADRecordingOptions = {}) {
  const [state, setState] = useState<VADRecordingState>({
    isRecording: false,
    isTranscribing: false,
    transcription: '',
    error: null,
    vadScore: 0,
    isSpeechDetected: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const hasDetectedSpeechRef = useRef<boolean>(false);

  /**
   * Analyze audio chunk with backend VAD service
   */
  const analyzeAudioChunk = async (audioBlob: Blob): Promise<number> => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Call VAD endpoint
      const response = await fetch('/api/audio/vad/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_b64: base64Audio,
          audio_format: 'webm',
          reset_state: false,
        }),
      });

      if (!response.ok) {
        throw new Error('VAD analysis failed');
      }

      const data = await response.json();
      return data.average_score || 0;
    } catch (error) {
      console.error('VAD analysis error:', error);
      return 0;
    }
  };

  /**
   * Check for silence and auto-stop if needed
   */
  const checkSilence = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }

    const now = Date.now();
    
    // Only check if enough time has passed
    if (now - lastCheckTimeRef.current < checkInterval) {
      return;
    }

    lastCheckTimeRef.current = now;

    // Get recent audio chunk for VAD analysis
    if (audioChunksRef.current.length > 0) {
      const recentChunk = audioChunksRef.current[audioChunksRef.current.length - 1];
      const vadScore = await analyzeAudioChunk(recentChunk);

      setState((prev) => ({
        ...prev,
        vadScore,
        isSpeechDetected: vadScore > speechThreshold,
      }));

      // Track speech detection
      if (vadScore > speechThreshold) {
        hasDetectedSpeechRef.current = true;
        silenceStartRef.current = null; // Reset silence timer
      } else if (hasDetectedSpeechRef.current) {
        // Only start counting silence after we've detected speech
        if (silenceStartRef.current === null) {
          silenceStartRef.current = now;
        } else if (now - silenceStartRef.current >= silenceThreshold) {
          // Silence threshold reached - auto stop
          console.log('🛑 Silence detected, auto-stopping recording');
          stopRecording();
        }
      }
    }
  }, [checkInterval, speechThreshold, silenceThreshold]);

  /**
   * Start recording with VAD
   */
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      silenceStartRef.current = null;
      lastCheckTimeRef.current = 0;
      hasDetectedSpeechRef.current = false;

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Clear check interval
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Transcribe audio
        if (audioChunksRef.current.length > 0) {
          await transcribeAudio();
        }

        setState((prev) => ({ ...prev, isRecording: false }));
      };

      // Start recording with chunks every second
      mediaRecorder.start(1000);

      // Reset VAD state on backend
      await fetch('/api/audio/vad/reset', { method: 'POST' });

      setState((prev) => ({
        ...prev,
        isRecording: true,
        error: null,
        transcription: '',
        vadScore: 0,
        isSpeechDetected: false,
      }));

      // Start silence checking
      checkIntervalRef.current = setInterval(checkSilence, checkInterval / 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState((prev) => ({ ...prev, error: errorMessage }));
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [checkInterval, checkSilence, onError]);

  /**
   * Stop recording manually
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Transcribe recorded audio with Whisper
   */
  const transcribeAudio = async () => {
    try {
      setState((prev) => ({ ...prev, isTranscribing: true }));

      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Call Whisper transcription endpoint
      const response = await fetch('/api/audio/stt/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_b64: base64Audio,
          audio_format: 'webm',
          language: 'en',
          task: 'transcribe',
        }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        setState((prev) => ({
          ...prev,
          transcription: data.text,
          isTranscribing: false,
        }));

        if (onTranscriptionComplete) {
          onTranscriptionComplete(data.text);
        }
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isTranscribing: false,
      }));
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  /**
   * Toggle recording on/off
   */
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

