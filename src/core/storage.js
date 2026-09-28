// UI preferences localStorage (with user id prefix)
const UI_PREFIX = 'ft-ui-';

function loadUIPref(key, userId) {
  try {
    const data = localStorage.getItem(`${UI_PREFIX}${userId}-${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function saveUIPref(key, userId, value) {
  try {
    localStorage.setItem(`${UI_PREFIX}${userId}-${key}`, JSON.stringify(value));
  } catch (e) {
    // Silencioso
  }
}

function clearUIPrefs(userId) {
  Object.keys(localStorage)
    .filter(k => k.startsWith(`${UI_PREFIX}${userId}`))
    .forEach(k => localStorage.removeItem(k));
}

// Clear app data (for logout) - only removes app keys, not localStorage.clear()
export async function clearAppData(userId) {
  // Remove old global keys if they exist
  localStorage.removeItem('ft-profile');
  localStorage.removeItem('ft-food-library');
  localStorage.removeItem('ft-diary');

  // Remove UI preferences for this user
  clearUIPrefs(userId);
}
