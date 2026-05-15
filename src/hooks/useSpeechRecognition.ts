import { useState, useEffect, useRef, useCallback } from 'react';
import { parseSpokenIngredients } from '../lib/parseSpeech';

interface SpeechCallbacks {
  onIngredients: (ingredients: string[]) => void;
  onError: (message: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  speechSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

// The Web Speech API has incomplete TypeScript coverage; use `any` for the
// recognition instance to avoid fighting vendor-prefix type gymnastics.
type AnyWindow = Window & Record<string, unknown>;

export function useSpeechRecognition(callbacks: SpeechCallbacks): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const w = window as unknown as AnyWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => any) | undefined;
    if (!SR) return;
    setSpeechSupported(true);

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) finalTranscriptRef.current += final;
      setTranscript(finalTranscriptRef.current + interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      finalTranscriptRef.current = '';
      setTranscript('');
      const err = e.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        callbacksRef.current.onError('Microphone access blocked. Enable it in your browser settings to use voice input.');
      } else if (err === 'no-speech') {
        callbacksRef.current.onError("Didn't catch that — try again and speak clearly.");
      } else if (err === 'audio-capture') {
        callbacksRef.current.onError('No microphone found.');
      } else if (err !== 'aborted') {
        callbacksRef.current.onError('Voice input hit a snag. Tap to retry.');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      const text = finalTranscriptRef.current as string;
      finalTranscriptRef.current = '';
      setTranscript('');
      if (text.trim()) {
        const ings = parseSpokenIngredients(text);
        callbacksRef.current.onIngredients(ings);
      }
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* ignore */ }
      try { rec.abort(); } catch { /* ignore */ }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try { recognitionRef.current.stop(); } catch { /* ignore */ }
  }, [isListening]);

  return { isListening, transcript, speechSupported, startListening, stopListening };
}
