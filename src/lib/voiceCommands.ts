export type VoiceCommand = 'next' | 'back' | 'repeat' | 'ingredients' | 'start-timer' | 'pause-timer' | 'stop-timer' | 'done';

// Checked in order; the first pattern that matches wins.
const PATTERNS: Array<[VoiceCommand, RegExp]> = [
  ['start-timer', /\b(start|set|begin)\b.*\btimer\b|\btimer\b.*\b(start|go)\b/],
  ['pause-timer', /\b(pause|resume)\b.*\btimer\b|\bpause\b/],
  ['stop-timer', /\b(stop|cancel|clear)\b.*\btimer\b/],
  ['ingredients', /\b(ingredients?|what do i need)\b/],
  ['repeat', /\b(repeat|again|read( it)?|say that|what was that)\b/],
  ['back', /\b(back|previous|go back|last step)\b/],
  ['next', /\b(next|continue|forward|go on|done with this|okay next)\b/],
  ['done', /\b(finish(ed)?|all done|i'?m done)\b/],
];

/** Maps a spoken phrase to a cooking command, or null when it isn't one. */
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const t = transcript.toLowerCase().trim();
  if (!t) return null;
  for (const [cmd, re] of PATTERNS) if (re.test(t)) return cmd;
  return null;
}
