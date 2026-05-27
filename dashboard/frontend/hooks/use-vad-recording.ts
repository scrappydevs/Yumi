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
  silenceThreshold?: number;
  checkInterval?: number;
  speechThreshold?: number;
  onTranscriptionComplete?: (text: string) => void;
  onPartialTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  enableStreaming?: boolean;
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
  
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingChunksRef = useRef<Blob[]>([]);
  const accumulatedTranscriptionRef = useRef<string>('');
  const onPartialTranscriptionRef = useRef(onPartialTranscription);
  
  useEffect(() => {
    onPartialTranscriptionRef.current = onPartialTranscription;
  }, [onPartialTranscription]);

  /**
   * Analyze audio chunk with backend VAD service
   * NOTE: VAD is disabled - this function is a no-op
   */
  const analyzeAudioChunk = async (audioBlob: Blob): Promise<number> => {
    return 0;
  };

  /**
   * Check for silence and auto-stop if needed
   * NOTE: VAD is disabled - this function is a no-op
   */
  const checkSilence = useCallback(async () => {
    return;
  }, []);

  /**
   * Transcribe audio chunk for streaming
   */
  const transcribeChunk = async (audioChunks: Blob[]) => {
    if (audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
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

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('❌ Chunk transcription failed:', response.status, errorText);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.text && data.text.trim()) {
        const newText = data.text.trim();
        accumulatedTranscriptionRef.current += (accumulatedTranscriptionRef.current ? ' ' : '') + newText;
        
        
        if (onPartialTranscriptionRef.current) {
          onPartialTranscriptionRef.current(accumulatedTranscriptionRef.current);
        } else {
          console.warn('⚠️ No onPartialTranscription callback set!');
        }
      } else {
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
      
      const chunksToProcess = [...streamingChunksRef.current];
      streamingChunksRef.current = [];
      
      await transcribeChunk(chunksToProcess);
    } else {
    }
  };

  /**
   * Start recording (VAD disabled - manual stop required)
   */
  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      silenceStartRef.current = null;
      lastCheckTimeRef.current = 0;
      hasDetectedSpeechRef.current = false;
      streamingChunksRef.current = [];
      accumulatedTranscriptionRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          if (enableStreaming) {
            streamingChunksRef.current.push(event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length > 0) {
          await transcribeAudio();
        }

        setState((prev) => ({ ...prev, isRecording: false }));
      };

      mediaRecorder.start(1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        error: null,
        transcription: '',
        vadScore: 0,
        isSpeechDetected: false,
      }));

      if (enableStreaming && onPartialTranscription) {
        streamingIntervalRef.current = setInterval(async () => {
          await processStreamingChunks();
        }, streamingInterval);
      }

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

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

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
        if (!data.error || data.error.includes('No audio') || data.error.includes('silence')) {
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

