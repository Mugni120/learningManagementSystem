// Simple in-memory TTL cache for read-heavy queries.
// Keys are namespaced, e.g. "published:catalog", "published:tree:<slug>".
const DEFAULT_TTL_MS = Number(process.env.CACHE_TTL_MS) || 30_000;

const store = new Map();

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
};

const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
};

const del = (key) => {
  store.delete(key);
};

const flushByPrefix = (prefix) => {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

const flushAll = () => {
  store.clear();
};

module.exports = { get, set, del, flushByPrefix, flushAll, DEFAULT_TTL_MS };
