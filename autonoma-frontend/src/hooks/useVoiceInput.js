import { useState, useRef, useCallback, useEffect } from 'react';
import axiosServices from 'utils/axios';

const LANG_TO_BCP47 = {
  EN: 'en-US',
  TA: 'ta-IN',
  HI: 'hi-IN',
  TE: 'te-IN',
  ML: 'ml-IN',
  KN: 'kn-IN'
};

/**
 * Custom hook wrapping MediaRecorder and Groq Whisper API,
 * with Web Speech API for real-time interim results and silence detection.
 * Avoids dual microphone connection conflicts on mobile devices.
 */
export default function useVoiceInput(languageCode = 'EN') {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia);

  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const onFinalResultRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startListening = useCallback(
    async (onFinalResult) => {
      if (!supported) return;
      onFinalResultRef.current = onFinalResult;
      setTranscript('');
      audioChunksRef.current = [];

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      // 1. Setup Web Speech API for interim results & silence detection (non-mobile only to prevent stream locks)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !isMobile) {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        recognition.lang = LANG_TO_BCP47[languageCode] || 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          setTranscript(fullText);

          // Reset silence timeout on speech
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            stopListening();
          }, 2500); // 2.5 seconds of silence stops listening
        };

        try {
          recognition.start();
        } catch (e) {}
      }

      // 2. Setup MediaRecorder for high-quality audio capture
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          setListening(true);
          // Initial silence timeout if no speech at all
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

          if (!isMobile) {
            silenceTimeoutRef.current = setTimeout(() => {
              stopListening();
            }, 6000); // 6 seconds initial timeout for desktop
          } else {
            silenceTimeoutRef.current = setTimeout(() => {
              stopListening();
            }, 60000); // 60 seconds safety cutoff for mobile
          }
        };

        mediaRecorder.onstop = async () => {
          setListening(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Stop all tracks to release microphone
          stream.getTracks().forEach((track) => track.stop());

          // Send to backend
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          if (languageCode) {
            formData.append('language', languageCode.substring(0, 2).toLowerCase());
          }

          setTranscript('Transcribing...');

          try {
            const response = await axiosServices.post('/api/ai/transcribe', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            if (response.data) {
              const text = response.data.transcript || '';
              setTranscript(text);
              if (onFinalResultRef.current) {
                onFinalResultRef.current(text);
              }
            } else {
              setTranscript('Error transcribing audio');
            }
          } catch (error) {
            console.error('Transcription error:', error);
            setTranscript('Error transcribing audio');
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Microphone access denied or error:', err);
        setListening(false);
      }
    },
    [supported, languageCode, stopListening]
  );

  const resetTranscript = useCallback(() => setTranscript(''), []);

  // Ensure microphone streams and SpeechRecognition instances are closed on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { transcript, listening, supported, startListening, stopListening, resetTranscript };
}
