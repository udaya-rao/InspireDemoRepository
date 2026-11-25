
export const getParsedDraft = (key) => {
  try {
    const rawData = localStorage.getItem(key);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    console.error(`Error parsing draft for key "${key}":`, error);
    return null;
  }
};


export const saveDraft = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving draft for key "${key}":`, error);
  }
};


export const removeDraft = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing draft for key "${key}":`, error);
  }
};
