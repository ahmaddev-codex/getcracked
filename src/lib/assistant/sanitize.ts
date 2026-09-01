/**
 * Sanitizes AI Assistant text output:
 * 1. Converts keycap number emojis (1️⃣, 2️⃣, 3️⃣...) into standard Markdown numbered lists (1., 2., 3.).
 * 2. Converts circled numbers (①, ②, ❶, ❷...) into standard digits.
 * 3. Strips remaining emojis and symbols to maintain clean, technical typography.
 */
export function cleanAssistantText(text: string): string {
  if (!text) return '';

  return (
    text
      // 1. Keycap numbers: 1️⃣ -> 1., 2️⃣ -> 2., etc.
      .replace(/([0-9])\uFE0F?\u20E3/g, '$1.')
      // 🔟 -> 10.
      .replace(/\uD83D\uDD1F/g, '10.')
      // Circled digits: ① -> 1., ② -> 2., etc.
      .replace(/[\u2460-\u2469]/g, (m) => `${m.charCodeAt(0) - 0x245F}. `)
      .replace(/[\u2776-\u277F]/g, (m) => `${m.charCodeAt(0) - 0x2775}. `)
      // Strip remaining decorative emojis
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2B55}]|[\u{2934}]|[\u{2935}]|[\u{25AA}]|[\u{25AB}]/gu,
        ''
      )
  );
}
