export function readLocal<T>(key: string, fallback: T): T {
  try {
    const serialized = window.localStorage.getItem(key);
    return serialized === null ? fallback : (JSON.parse(serialized) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function updateLocal<T>(
  key: string,
  fallback: T,
  update: (current: T) => T,
) {
  const value = update(readLocal(key, fallback));
  writeLocal(key, value);
  return value;
}
