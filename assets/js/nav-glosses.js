/**
 * The masthead's glosses: a name that doesn't explain itself (Palette, Bestiary) says what it is
 * in the Photobook's small glass label, under the pointer or on keyboard focus. The label is the
 * one every page shares (photobook/tip.js), set up once however many scripts ask for it.
 */
import { tips } from './photobook/tip.js';

if (document.querySelector('.masthead [data-tip]')) tips();
