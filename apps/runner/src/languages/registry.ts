import type { LabLanguage } from '@mettle/shared';
import { bash } from './bash';
import { cpp } from './cpp';
import { csharp } from './csharp';
import { python } from './python';
import { rust } from './rust';
import type { LanguageSpec } from './types';
import { yaml } from './yaml';

/** Adding a language is one harness file, one sandbox image and one entry here. */
export const languages: Record<LabLanguage, LanguageSpec> = { rust, python, bash, cpp, csharp, yaml };
