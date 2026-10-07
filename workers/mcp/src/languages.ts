/**
 * The content languages this server speaks. Every language check goes through here,
 * so a stray value such as 'en-EN' fails the type check and the tool schema.
 */
export const LANGUAGES = { EN: 'en', PT: 'pt' } as const;

export type Lang = (typeof LANGUAGES)[keyof typeof LANGUAGES];

/** For zod enums: a non-empty tuple of every language code. */
export const LANG_VALUES = Object.values(LANGUAGES) as [Lang, ...Lang[]];

export const DEFAULT_LANG: Lang = LANGUAGES.EN;
