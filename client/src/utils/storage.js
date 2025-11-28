export function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`readJSON ${key} error`, e);
    return null;
  }
}

export function writeJSON(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.error(`writeJSON ${key} error`, e);
  }
}
