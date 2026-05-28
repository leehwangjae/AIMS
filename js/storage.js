const STORAGE_PREFIX = 'aims_';

export function getStorageKey(name) {
  return `${STORAGE_PREFIX}${name}`;
}

export function readCollection(name, fallback = []) {
  const raw = localStorage.getItem(getStorageKey(name));

  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`${name} 저장 데이터 파싱 오류`, error);
    return fallback;
  }
}

export function writeCollection(name, value) {
  localStorage.setItem(getStorageKey(name), JSON.stringify(value));
  return value;
}

export function initializeCollection(name, defaultValue = []) {
  const key = getStorageKey(name);

  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
  }

  return readCollection(name, defaultValue);
}

export function clearAimsStorage() {
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}
