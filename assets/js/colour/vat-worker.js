/**
 * Measures dye vats off the page's thread (./vat.js measureOff): reading the GPU back waits for it,
 * and here the wait holds up nothing a reader touches. One message a vat: its plan's arguments in, its
 * gains and areas out; an error sends the page back to measuring on its own.
 */

import { measureOff } from './vat.js';

onmessage = ({ data: { id, args } }) => {
  try { postMessage({ id, ...measureOff(...args) }); } catch (e) { postMessage({ id, error: String(e?.message || e) }); }
};
