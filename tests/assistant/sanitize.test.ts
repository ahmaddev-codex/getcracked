import { describe, expect, it } from 'vitest';
import { cleanAssistantText } from '@/lib/assistant/sanitize';

describe('cleanAssistantText', () => {
  it('converts keycap number emojis into standard markdown numbers', () => {
    const input = '1️⃣ Build a Strong Foundations Layer\n2️⃣ Master the Classic DSA Problem Set\n3️⃣ Transition to System Design\n🔟 Tenth step';
    const output = cleanAssistantText(input);

    expect(output).toContain('1. Build a Strong Foundations Layer');
    expect(output).toContain('2. Master the Classic DSA Problem Set');
    expect(output).toContain('3. Transition to System Design');
    expect(output).toContain('10. Tenth step');
    expect(output).not.toContain('1️⃣');
    expect(output).not.toContain('2️⃣');
    expect(output).not.toContain('3️⃣');
    expect(output).not.toContain('🔟');
  });

  it('strips decorative emojis like rockets, fire, sparkles, lightbulbs', () => {
    const input = '🚀 Fast start! 💡 Tip: understand time complexity. 🔥 Daily habit.';
    const output = cleanAssistantText(input);

    expect(output).toBe(' Fast start!  Tip: understand time complexity.  Daily habit.');
    expect(output).not.toContain('🚀');
    expect(output).not.toContain('💡');
    expect(output).not.toContain('🔥');
  });

  it('handles empty or blank input gracefully', () => {
    expect(cleanAssistantText('')).toBe('');
  });
});
