import type { LabLanguage } from '@mettle/shared';
import { bash } from './bash';
import { cpp } from './cpp';
import { go } from './go';
import { csharp } from './csharp';
import { python } from './python';
import { rust } from './rust';
import { solidity } from './solidity';
import { typescript } from './typescript';
import type { LanguageSpec } from './types';
import { yaml } from './yaml';

/** Adding a language is one harness file, one sandbox image and one entry here. */
export const languages: Record<LabLanguage, LanguageSpec> = { rust, python, bash, cpp, csharp, yaml, typescript, go, solidity };
