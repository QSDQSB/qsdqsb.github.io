/**
 * Reactive state store for the gallery viewer.
 * Modules call setState() to update; subscribe() / subscribeAll() to react.
 */

const _state = {
  mode:    'grid',  // 'grid' | 'viewer'
  current: null,    // 0-based slide index | null
  total:   0,
  bgSize:  'cover', // 'cover' | 'contain'
  locked:  false,
};

const _keySubs = new Map(); // key → Set<fn(value, fullState)>
const _allSubs = new Set(); // fn(changedKeys[], fullState)

export function getState() { return { ..._state }; }

export function setState(patch) {
  const changed = [];
  for (const key of Object.keys(patch)) {
    if (_state[key] !== patch[key]) {
      _state[key] = patch[key];
      changed.push(key);
    }
  }
  if (!changed.length) return;
  for (const key of changed) {
    _keySubs.get(key)?.forEach(fn => fn(_state[key], _state));
  }
  _allSubs.forEach(fn => fn(changed, _state));
}

/** Subscribe to changes on a single key. Returns an unsubscribe function. */
export function subscribe(key, fn) {
  if (!_keySubs.has(key)) _keySubs.set(key, new Set());
  _keySubs.get(key).add(fn);
  return () => _keySubs.get(key).delete(fn);
}

/** Subscribe to any state change. Returns an unsubscribe function. */
export function subscribeAll(fn) {
  _allSubs.add(fn);
  return () => _allSubs.delete(fn);
}
