import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import type { Extension } from '@codemirror/state';
import type { Language, RunnableLanguage } from '@/content/schema';

/**
 * CodeMirror language support, chosen per language.
 */
export function languageExtension(language: Language | RunnableLanguage | string): Extension {
  if (language === 'python') return python();
  if (language === 'typescript') return javascript({ typescript: true });
  return javascript();
}
