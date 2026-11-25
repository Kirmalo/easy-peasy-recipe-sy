import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { parseVoiceCommand, type VoiceCommand } from '../lib/voiceCommands';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recognition = any;

function getCtor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined;
}

export type HandsFreeStatus =
  | 'off'
  | 'starting'
  | 'listening'
  | 'speaking'   // reading a step aloud; mic paused so the app doesn't hear itself
  | 'blocked'    // microphone permission denied
  | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone blocked — allow it for this site in your browser settings, then try again.',
  'service-not-allowed': 'Microphone blocked — allow it for this site in your browser settings, then try again.',
  'audio-capture': 'No microphone found.',
  network: "Voice recognition needs an internet connection and couldn't reach the speech service.",
  'language-not-supported': "Voice recognition doesn't support your device language.",
};

// Android Chrome's continuous mode is unreliable: it stops early and repeats results.
// One-utterance sessions restarted after each result work far better there.
const IS_ANDROID = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

/**
 * Hands-free voice control for cooking mode.
 * `start()` must be called from a tap (browsers require a user gesture for the mic).
 * Listening restarts automatically after each phrase, pauses while `speak()` reads aloud,
 * and resumes even if the browser never reports that speech finished.
 */
export function useHandsFree(onCommand: (cmd: VoiceCommand) => void) {
  const [supported] = useState(() => getCtor() !== undefined);
  const [status, setStatus] = useState<HandsFreeStatus>('off');
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const wantOnRef = useRef(false);        // user has hands-free switched on
  const speakingRef = useRef(false);      // mic intentionally paused for speech
  const restartTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // keep alive: Chrome drops onend for GC'd utterances
  const recentErrors = useRef<number[]>([]);
  const lastCommand = useRef<{ cmd: VoiceCommand; at: number } | null>(null);
  const handlerRef = useRef(onCommand);
  useLayoutEffect(() => { handlerRef.current = onCommand; });

  const listen = useCallback(() => {
    const rec = recRef.current;
    if (!rec || !wantOnRef.current || speakingRef.current) return;
    try { rec.start(); } catch { /* already running */ }
  }, []);

  const scheduleRestart = useCallback((delay = 250) => {
    clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(listen, delay);
  }, [listen]);

  const stop = useCallback(() => {
    wantOnRef.current = false;
    speakingRef.current = false;
    clearTimeout(restartTimer.current);
    clearTimeout(resumeTimer.current);
    try { recRef.current?.abort(); } catch { /* ignore */ }
    recRef.current = null;
    window.speechSynthesis?.cancel();
    setStatus('off');
    setHeard('');
  }, []);

  const start = useCallback(() => {
    const SR = getCtor();
    if (!SR) return;
    stop();
    setError(null);
    recentErrors.current = [];
    const rec = new SR();
    rec.continuous = !IS_ANDROID;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.lang = navigator.language || 'en-US';

    rec.onstart = () => setStatus('listening');
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[e.results.length - 1][0].transcript;
      setHeard(text);
      const cmd = parseVoiceCommand(text);
      if (!cmd) return;
      // Some browsers deliver the same final result twice; ignore an immediate repeat.
      const now = Date.now();
      if (lastCommand.current && lastCommand.current.cmd === cmd && now - lastCommand.current.at < 1500) return;
      lastCommand.current = { cmd, at: now };
      handlerRef.current(cmd);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // normal: silence, or our own pause
      const message = ERROR_MESSAGES[e.error] ?? `Voice input stopped (${e.error}).`;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
        wantOnRef.current = false;
        setError(message);
        setStatus(e.error === 'audio-capture' ? 'error' : 'blocked');
        return;
      }
      // Transient errors: retry, but give up if they keep coming.
      const now = Date.now();
      recentErrors.current = [...recentErrors.current.filter((t) => now - t < 10_000), now];
      if (recentErrors.current.length >= 4) {
        wantOnRef.current = false;
        setError(message);
        setStatus('error');
      }
    };
    rec.onend = () => {
      if (!wantOnRef.current) return;
      if (speakingRef.current) { setStatus('speaking'); return; }
      setStatus('starting');
      scheduleRestart(recentErrors.current.length ? 1000 : 250);
    };

    recRef.current = rec;
    wantOnRef.current = true;
    setStatus('starting');
    try { rec.start(); } catch { setStatus('error'); setError('Voice input could not start.'); }
  }, [stop, scheduleRestart]);

  const resumeAfterSpeech = useCallback(() => {
    clearTimeout(resumeTimer.current);
    if (!speakingRef.current) return;
    speakingRef.current = false;
    utteranceRef.current = null;
    if (wantOnRef.current) { setStatus('starting'); scheduleRestart(300); }
  }, [scheduleRestart]);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    if (wantOnRef.current) {
      speakingRef.current = true;
      setStatus('speaking');
      clearTimeout(restartTimer.current);
      try { recRef.current?.abort(); } catch { /* ignore */ }
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = navigator.language || 'en-US';
    u.onend = resumeAfterSpeech;
    u.onerror = resumeAfterSpeech;
    utteranceRef.current = u;
    synth.speak(u);
    // Fallback: some Android builds never fire onend. Resume after a generous estimate.
    clearTimeout(resumeTimer.current);
    const estimateMs = Math.min(30_000, 1500 + text.split(/\s+/).length * 450);
    resumeTimer.current = setTimeout(resumeAfterSpeech, estimateMs);
  }, [resumeAfterSpeech]);

  useEffect(() => stop, [stop]); // turn everything off when cooking mode closes

  return { supported, status, active: status !== 'off' && status !== 'blocked' && status !== 'error', heard, error, start, stop, speak };
}
