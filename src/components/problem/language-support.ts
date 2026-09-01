import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import type { Extension } from '@codemirror/state';
import type { Language } from '@/content/schema';

/**
 * CodeMirror language support, chosen per language.
 *
 * Shared by the problem editor and the walkthrough's read-only code panel so the
 * two cannot disagree. Before this, both hardcoded `javascript()` — which meant
 * every Python solution was highlighted with JavaScript's grammar: `def`, `elif`
 * and `None` were plain text, and `#` comments were not recognised as comments
 * at all.
 */
export function languageExtension(language: Language | 'typescript'): Extension {
  if (language === 'python') return python();
  if (language === 'typescript') return javascript({ typescript: true });
  return javascript();
}
