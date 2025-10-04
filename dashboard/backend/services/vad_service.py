# Copyright 2022 David Scripka. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#######################
# Silero VAD License
#######################

# MIT License

# Copyright (c) 2020-present Silero Team

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

########################################

# This file contains the implementation of a class for voice activity detection (VAD),
# based on the pre-trained model from Silero (https://github.com/snakers4/silero-vad).
# It can be used with the openWakeWord library, or independently.

"""
Voice Activity Detection (VAD) Service using Silero VAD model

This service provides voice activity detection capabilities for audio streams,
useful for automatic silence detection in voice recording applications.
"""

import onnxruntime as ort
import numpy as np
import os
from collections import deque
from typing import Optional
import base64
import io
from pydub import AudioSegment


class VAD():
    """
    A model class for voice activity detection (VAD) based on Silero's model:

    https://github.com/snakers4/silero-vad
    """
    def __init__(self,
                 model_path: str = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    "..",
                    "resources",
                    "models",
                    "silero_vad.onnx"
                 ),
                 n_threads: int = 1
                 ):
        """Initialize the VAD model object.

            Args:
                model_path (str): The path to the Silero VAD ONNX model.
                n_threads (int): The number of threads to use for the VAD model.
        """

        # Initialize the ONNX model
        sessionOptions = ort.SessionOptions()
        sessionOptions.inter_op_num_threads = n_threads
        sessionOptions.intra_op_num_threads = n_threads
        self.model = ort.InferenceSession(model_path, sess_options=sessionOptions,
                                          providers=["CPUExecutionProvider"])

        # Create buffer
        self.prediction_buffer: deque = deque(maxlen=125)  # buffer length of 10 seconds

        # Set model parameters
        self.sample_rate = np.array(16000).astype(np.int64)

        # Reset model to start
        self.reset_states()

    def reset_states(self, batch_size=1):
        """Reset the internal state of the VAD model"""
        self._h = np.zeros((2, batch_size, 64)).astype('float32')
        self._c = np.zeros((2, batch_size, 64)).astype('float32')
        self._last_sr = 0
        self._last_batch_size = 0

    def predict(self, x, frame_size=480):
        """
        Get the VAD predictions for the input audio frame.

        Args:
            x (np.ndarray): The input audio, must be 16 khz and 16-bit PCM format.
                            If longer than the input frame, will be split into
                            chunks of length `frame_size` and the predictions for
                            each chunk returned. Must be a length that is integer
                            multiples of the `frame_size` argument.
            frame_size (int): The frame size in samples. The recommended
                              default is 480 samples (30 ms @ 16khz),
                              but smaller and larger values
                              can be used (though performance may decrease).

        Returns
            float: The average predicted score for the audio frame
        """
        chunks = [(x[i:i+frame_size]/32767).astype(np.float32)
                  for i in range(0, x.shape[0], frame_size)]

        frame_predictions = []
        for chunk in chunks:
            ort_inputs = {'input': chunk[None, ],
                          'h': self._h, 'c': self._c, 'sr': self.sample_rate}
            ort_outs = self.model.run(None, ort_inputs)
            out, self._h, self._c = ort_outs
            frame_predictions.append(out[0][0])

        return np.mean(frame_predictions)

    def __call__(self, x, frame_size=160*4):
        """Add prediction to buffer and return current score"""
        score = self.predict(x, frame_size)
        self.prediction_buffer.append(score)
        return score
    
    def get_average_score(self, window_size: int = 10) -> float:
        """
        Get average VAD score over recent predictions
        
        Args:
            window_size: Number of recent predictions to average
            
        Returns:
            float: Average VAD score (0.0 = silence, 1.0 = speech)
        """
        if len(self.prediction_buffer) == 0:
            return 0.0
        
        recent_scores = list(self.prediction_buffer)[-window_size:]
        return np.mean(recent_scores)


class VADService:
    """Service wrapper for VAD operations with audio format conversion"""
    
    def __init__(self):
        """Initialize VAD service with Silero model"""
        self.vad = VAD()
        print("✅ VAD Service initialized with Silero model")
    
    def analyze_audio_chunk(
        self, 
        audio_data: bytes, 
        audio_format: str = "webm",
        reset_state: bool = False
    ) -> dict:
        """
        Analyze an audio chunk for voice activity
        
        Args:
            audio_data: Raw audio bytes
            audio_format: Format of the audio (webm, mp3, wav, etc.)
            reset_state: Whether to reset VAD state before analysis
            
        Returns:
            dict with VAD score and metadata
        """
        try:
            if reset_state:
                self.vad.reset_states()
            
            # Convert audio to 16kHz 16-bit PCM
            audio_segment = AudioSegment.from_file(
                io.BytesIO(audio_data), 
                format=audio_format
            )
            
            # Convert to 16kHz mono
            audio_segment = audio_segment.set_frame_rate(16000).set_channels(1)
            
            # Get raw PCM data
            samples = np.array(audio_segment.get_array_of_samples(), dtype=np.int16)
            
            # Run VAD prediction
            vad_score = self.vad(samples)
            
            # Get rolling average
            avg_score = self.vad.get_average_score()
            
            return {
                "success": True,
                "vad_score": float(vad_score),
                "average_score": float(avg_score),
                "is_speech": vad_score > 0.5,
                "buffer_size": len(self.vad.prediction_buffer),
                "audio_duration_ms": len(audio_segment)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "vad_score": 0.0,
                "is_speech": False
            }
    
    def analyze_audio_base64(
        self,
        audio_b64: str,
        audio_format: str = "webm",
        reset_state: bool = False
    ) -> dict:
        """
        Analyze base64-encoded audio for voice activity
        
        Args:
            audio_b64: Base64-encoded audio data
            audio_format: Format of the audio
            reset_state: Whether to reset VAD state
            
        Returns:
            dict with VAD score and metadata
        """
        try:
            audio_data = base64.b64decode(audio_b64)
            return self.analyze_audio_chunk(audio_data, audio_format, reset_state)
        except Exception as e:
            return {
                "success": False,
                "error": f"Base64 decode error: {str(e)}",
                "vad_score": 0.0,
                "is_speech": False
            }
    
    def reset(self):
        """Reset VAD state and buffer"""
        self.vad.reset_states()
        self.vad.prediction_buffer.clear()


# Singleton instance
_vad_service: Optional[VADService] = None


def get_vad_service() -> VADService:
    """Get or create the singleton VAD service instance"""
    global _vad_service
    if _vad_service is None:
        _vad_service = VADService()
    return _vad_service

