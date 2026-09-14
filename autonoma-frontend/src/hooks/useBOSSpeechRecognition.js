import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';

/**
 * Reusable hook for Web Speech API SpeechRecognition with standardized error reporting.
 *
 * @param {Object} options Configuration options
 * @param {Function} options.onResult Callback triggered when final text is recognized
 * @param {string} options.lang Language code (default: 'en-US')
 */
export default function useBOSSpeechRecognition({ onResult, lang = 'en-US' } = {}) {
  const dispatch = useDispatch();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Speech recognition stop warning:', e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Speech Recognition is not supported by your browser.',
          variant: 'alert',
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    setPermissionDenied(false);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = lang;

    recog.onstart = () => {
      setIsListening(true);
    };

    recog.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
      if (final && onResult) {
        onResult(final.trim());
      }
    };

    recog.onerror = (event) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed') {
        setPermissionDenied(true);
        return;
      }

      let errorMsg = 'Error during voice recognition. Please try again.';
      if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error. Speech recognition requires an active internet connection.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone detected. Please connect a mic and try again.';
      }

      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: event.error === 'no-speech' ? 'info' : 'error',
          close: false
        })
      );
    };

    recog.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    try {
      recog.start();
      recognitionRef.current = recog;
    } catch (err) {
      console.warn('Speech start error:', err);
    }
  }, [isSupported, lang, onResult, dispatch]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    interimText,
    permissionDenied,
    setPermissionDenied,
    startListening,
    stopListening,
    toggleListening
  };
}
