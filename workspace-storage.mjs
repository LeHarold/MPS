const DATA_KEYS = [
  'map-workspace-project-v2', 'map-sidebar-collapsed', 'map-project-library',
  'atlas-objects', 'atlas-unit', 'atlas-basemap', 'map-drawing-color'
];

function transaction(db, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', mode);
    const request = action(tx.objectStore('workspace'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = tx.onerror = () => reject(tx.error || Error('無法保存工作區'));
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mps-workspace-storage', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace', {keyPath:'key'});
    request.onblocked = () => reject(Error('工作區儲存目前被其他分頁占用'));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}

export async function openWorkspaceStorage(onSaveError = () => {}) {
  const values = new Map();
  for (const key of DATA_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) values.set(key, value);
    } catch {}
  }
  let db;
  const existingBackups = new Set();
  try {
    db = await openDatabase();
    const records = await transaction(db, 'readonly', store => store.getAll());
    for (const {key, value, recover} of records) {
      existingBackups.add(key);
      if (recover || !values.has(key)) values.set(key, value);
    }
  } catch { db = null; }

  function writeBackup(key, value, recover) {
    if (!db) return null;
    const record = {key, value, recover};
    return transaction(db, 'readwrite', store => store.put(record))
      .catch(async () => {
        // Safari can close a database connection after suspending the app.
        db = await openDatabase();
        if (values.get(key) === value) {
          await transaction(db, 'readwrite', store => store.put(record));
        }
      });
  }

  for (const [key, value] of values) {
    if (!existingBackups.has(key)) writeBackup(key, value, false)?.catch(() => {});
  }
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      values.set(key, value);
      let savedLocally = false;
      try { localStorage.setItem(key, value); savedLocally = true; } catch {}
      const backup = writeBackup(key, value, !savedLocally);
      if (!savedLocally && !backup) throw Error('瀏覽器儲存空間無法使用');
      backup?.catch(error => { if (!savedLocally) onSaveError(error); });
    }
  };
}
