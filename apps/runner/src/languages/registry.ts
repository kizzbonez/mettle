import type { LabLanguage } from '@mettle/shared';
import { bash } from './bash';
import { python } from './python';
import { rust } from './rust';
import type { LanguageSpec } from './types';

/** Adding a language is one harness file, one sandbox image and one entry here. */
export const languages: Record<LabLanguage, LanguageSpec> = { rust, python, bash };
