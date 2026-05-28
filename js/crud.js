export function createItem(storageKey, item) {
  const items = getItems(storageKey);
  items.push(item);
  saveItems(storageKey, items);
  return item;
}

export function getItems(storageKey) {
  const raw = localStorage.getItem(storageKey);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`${storageKey} 데이터 파싱 오류`, error);
    return [];
  }
}

export function updateItem(storageKey, itemId, updatedData) {
  const items = getItems(storageKey);

  const updatedItems = items.map(item => {
    if (item.id !== itemId) return item;

    return {
      ...item,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
  });

  saveItems(storageKey, updatedItems);

  return updatedItems.find(item => item.id === itemId);
}

export function deleteItem(storageKey, itemId) {
  const items = getItems(storageKey);

  const filteredItems = items.filter(item => item.id !== itemId);

  saveItems(storageKey, filteredItems);

  return filteredItems;
}

export function saveItems(storageKey, items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}
