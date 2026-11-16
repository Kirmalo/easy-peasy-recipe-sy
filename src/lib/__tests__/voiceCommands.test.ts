import { describe, it, expect } from 'vitest';
import { parseVoiceCommand } from '../voiceCommands';

describe('parseVoiceCommand', () => {
  it.each([
    ['next', 'next'],
    ['Okay, next step please', 'next'],
    ['go back', 'back'],
    ['previous', 'back'],
    ['can you repeat that', 'repeat'],
    ['read it', 'repeat'],
    ['start the timer', 'start-timer'],
    ['set a timer', 'start-timer'],
    ['pause', 'pause-timer'],
    ['cancel the timer', 'stop-timer'],
    ['what are the ingredients', 'ingredients'],
    ["I'm done", 'done'],
  ] as const)('"%s" → %s', (said, cmd) => expect(parseVoiceCommand(said)).toBe(cmd));

  it('ignores chatter', () => {
    expect(parseVoiceCommand('this smells amazing')).toBeNull();
    expect(parseVoiceCommand('')).toBeNull();
  });
});
