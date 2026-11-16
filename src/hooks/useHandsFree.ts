import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { parseVoiceCommand, type VoiceCommand } from '../lib/voiceCommands';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recognition = any;

function getCtor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined;
}

/**
 * Continuous voice control for cooking mode. Listens while `enabled`, maps phrases to
 * commands, and can read text aloud (recognition pauses while speaking so the app
 * doesn't hear itself).
 */
export function useHandsFree(enabled: boolean, onCommand: (cmd: VoiceCommand) => void) {
  const [supported] = useState(() => getCtor() !== undefined);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const recRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false); // should be listening (not paused for speech)
  const handlerRef = useRef(onCommand);
  useLayoutEffect(() => { handlerRef.current = onCommand; });

  useEffect(() => {
    const SR = getCtor();
    if (!enabled || !SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[e.results.length - 1][0].transcript;
      setHeard(text);
      const cmd = parseVoiceCommand(text);
      if (cmd) handlerRef.current(cmd);
    };
    rec.onstart = () => setListening(true);
    // Browsers end continuous sessions after silence — restart while still enabled.
    rec.onend = () => {
      setListening(false);
      if (activeRef.current) { try { rec.start(); } catch { /* already starting */ } }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') activeRef.current = false;
    };
    recRef.current = rec;
    activeRef.current = true;
    try { rec.start(); } catch { /* ignore */ }
    return () => {
      activeRef.current = false;
      recRef.current = null;
      try { rec.abort(); } catch { /* ignore */ }
      window.speechSynthesis?.cancel();
    };
  }, [enabled]);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const rec = recRef.current;
    synth.cancel();
    if (rec) { activeRef.current = false; try { rec.abort(); } catch { /* ignore */ } }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = navigator.language || 'en-US';
    u.onend = u.onerror = () => {
      if (recRef.current === rec && rec) { activeRef.current = true; try { rec.start(); } catch { /* ignore */ } }
    };
    synth.speak(u);
  }, []);

  return { supported, listening, heard, speak };
}
