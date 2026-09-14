import { useState, useRef, useCallback } from 'react';

const LANG_TO_BCP47 = {
  EN: 'en-US',
  TA: 'ta-IN',
  HI: 'hi-IN',
  TE: 'te-IN',
  ML: 'ml-IN',
  KN: 'kn-IN'
};

/**
 * Custom hook wrapping the Web Speech API SpeechSynthesis for text-to-speech.
 *
 * Usage:
 *   const { speak, speaking, stop, supported } = useVoiceSpeech('EN');
 */
export default function useVoiceSpeech(languageCode = 'EN') {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => !!window.speechSynthesis || !!window.Audio);
  const audioRef = useRef(null);

  const speak = useCallback(
    (text) => {
      if (!text || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const cleanText = text
        .replace(/\|/g, '') // remove table pipes
        .replace(/-{2,}/g, '') // remove long dashes (table separators)
        .replace(/\*/g, '') // remove bold/italic stars
        .replace(/#/g, '') // remove headers hashes
        .replace(/`/g, '') // remove code backticks
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = LANG_TO_BCP47[languageCode] || 'en-US';
      utterance.rate = 0.85; // Slower rate for better Tamil comprehensibility
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetLangPrefix = utterance.lang.split('-')[0];

      // Find high-quality cloud voices first: Edge Natural voices, then Google cloud voices
      const matchingVoice =
        voices.find((v) => v.lang.startsWith(targetLangPrefix) && v.name.includes('Online (Natural)')) ||
        voices.find((v) => v.lang.startsWith(targetLangPrefix) && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith(targetLangPrefix) && !v.localService && v.name.toLowerCase().includes('female')) ||
        voices.find((v) => v.lang.startsWith(targetLangPrefix) && !v.localService) ||
        voices.find((v) => v.lang.startsWith(targetLangPrefix) && v.name.toLowerCase().includes('female')) ||
        voices.find((v) => v.lang.startsWith(targetLangPrefix));

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        setSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [languageCode]
  );

  // Pre-load voices to avoid empty array on first call
  if (supported && window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  return { speak, speaking, stop, supported };
}
