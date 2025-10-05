/**
 * Audio Recording Hook (VAD Disabled)
 * 
 * Uses MediaRecorder to capture audio with Whisper transcription.
 * Note: VAD (Voice Activity Detection) is disabled - manual stop required.
 * 
 * Features:
 * - Real-time audio recording
 * - Whisper transcription integration
 * - Manual stop control
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
  /** Callback for streaming partial transcriptions */
  onPartialTranscription?: (text: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Enable streaming transcription (sends chunks while recording) */
  enableStreaming?: boolean;
  /** Interval (in ms) for sending audio chunks for transcription */
  streamingInterval?: number;
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
  onPartialTranscription,
  onError,
  enableStreaming = false,
  streamingInterval = 2000, // Send chunks every 2 seconds
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
  
  // Streaming transcription refs
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingChunksRef = useRef<Blob[]>([]);
  const accumulatedTranscriptionRef = useRef<string>('');
  const onPartialTranscriptionRef = useRef(onPartialTranscription);
  
  // Update callback ref when it changes
  useEffect(() => {
    onPartialTranscriptionRef.current = onPartialTranscription;
  }, [onPartialTranscription]);

  /**
   * Analyze audio chunk with backend VAD service
   * NOTE: VAD is disabled - this function is a no-op
   */
  const analyzeAudioChunk = async (audioBlob: Blob): Promise<number> => {
    // VAD disabled - return 0
    return 0;
  };

  /**
   * Check for silence and auto-stop if needed
   * NOTE: VAD is disabled - this function is a no-op
   */
  const checkSilence = useCallback(async () => {
    // VAD disabled - no automatic silence detection
    return;
  }, []);

  /**
   * Transcribe audio chunk for streaming
   */
  const transcribeChunk = async (audioChunks: Blob[]) => {
    if (audioChunks.length === 0) return;

    try {
      // Combine chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Call streaming transcription endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('🎤 Calling transcription API with', audioChunks.length, 'chunks');
      
      const response = await fetch(`${backendUrl}/api/audio/stt/transcribe-chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_b64: base64Audio,
          audio_format: 'webm',
          language: 'en',
          task: 'transcribe',
        }),
      });

      console.log('🎤 Transcription API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('❌ Chunk transcription failed:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('🎤 Transcription API response data:', data);
      
      if (data.success && data.text && data.text.trim()) {
        // Accumulate transcription
        const newText = data.text.trim();
        accumulatedTranscriptionRef.current += (accumulatedTranscriptionRef.current ? ' ' : '') + newText;
        
        console.log('📝 Partial transcription:', accumulatedTranscriptionRef.current);
        
        // Call partial transcription callback using ref (always has latest callback)
        if (onPartialTranscriptionRef.current) {
          console.log('📝 Calling onPartialTranscription callback');
          onPartialTranscriptionRef.current(accumulatedTranscriptionRef.current);
        } else {
          console.warn('⚠️ No onPartialTranscription callback set!');
        }
      } else {
        // Silence or no speech in this chunk is normal - don't spam warnings
        console.log('🔇 No speech in this chunk (silence is normal during pauses)');
      }
    } catch (error) {
      console.error('❌❌ Chunk transcription error:', error);
      console.error('❌❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
    }
  };

  /**
   * Process streaming chunks periodically
   */
  const processStreamingChunks = async () => {
    if (streamingChunksRef.current.length > 0) {
      console.log(`🔊 Processing ${streamingChunksRef.current.length} audio chunks for streaming transcription`);
      
      // Copy current chunks and clear for next batch
      const chunksToProcess = [...streamingChunksRef.current];
      streamingChunksRef.current = [];
      
      // Transcribe this batch
      await transcribeChunk(chunksToProcess);
    } else {
      console.log('⏭️ No chunks to process yet');
    }
  };

  /**
   * Start recording (VAD disabled - manual stop required)
   */
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      silenceStartRef.current = null;
      lastCheckTimeRef.current = 0;
      hasDetectedSpeechRef.current = false;
      streamingChunksRef.current = [];
      accumulatedTranscriptionRef.current = '';

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
          
          // Also collect for streaming if enabled
          if (enableStreaming) {
            streamingChunksRef.current.push(event.data);
          }
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Clear check interval
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        // Clear streaming interval
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
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

      // VAD disabled - no backend reset needed

      setState((prev) => ({
        ...prev,
        isRecording: true,
        error: null,
        transcription: '',
        vadScore: 0,
        isSpeechDetected: false,
      }));

      // Set up streaming transcription if enabled
      if (enableStreaming && onPartialTranscription) {
        console.log('🎤 Streaming transcription enabled, sending chunks every', streamingInterval, 'ms');
        streamingIntervalRef.current = setInterval(async () => {
          await processStreamingChunks();
        }, streamingInterval);
      }

      // VAD disabled - no silence checking interval
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState((prev) => ({ ...prev, error: errorMessage }));
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [onError, enableStreaming, onPartialTranscription, streamingInterval]);

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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/audio/stt/transcribe`, {
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
        // If no transcription but also no error, it's likely just silence/empty audio
        if (!data.error || data.error.includes('No audio') || data.error.includes('silence')) {
          console.log('ℹ️ No speech detected in recording');
          setState((prev) => ({
            ...prev,
            isTranscribing: false,
          }));
          if (onTranscriptionComplete) {
            onTranscriptionComplete(''); // Return empty string instead of throwing
          }
        } else {
          throw new Error(data.error || 'Transcription failed');
        }
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
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
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

