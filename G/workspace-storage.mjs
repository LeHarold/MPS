const DATA_KEYS = [
  'map-workspace-project-v2', 'map-sidebar-collapsed', 'map-project-library',
  'mps-map-view', 'atlas-objects', 'atlas-unit', 'atlas-basemap', 'map-drawing-color'
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

export async function openWorkspaceStorage(onSaveError = () => {}, namespace = "", {readOnly=false} = {}) {
  const values = new Map();
  const timestamps = new Map();
  for (const key of DATA_KEYS) {
    const storageKey=namespace+key;
    try {
      const value = localStorage.getItem(storageKey);
      if (value !== null) {
        values.set(key, value);
        timestamps.set(key, Number(localStorage.getItem(storageKey+':saved-at')) || 0);
      }
    } catch {}
  }
  let db;
  const existingBackups = new Set();
  try {
    db = await openDatabase();
    const records = await transaction(db, 'readonly', store => store.getAll());
    for (const {key:storageKey, value, recover, savedAt=0} of records) {
      if (!DATA_KEYS.includes(storageKey.slice(namespace.length)) || !storageKey.startsWith(namespace)) continue;
      const key=storageKey.slice(namespace.length);
      existingBackups.add(key);
      if (!values.has(key) || (savedAt > (timestamps.get(key)||0) || (recover && savedAt === (timestamps.get(key)||0)))) {
        values.set(key, value);
        timestamps.set(key,savedAt);
        try {
          localStorage.setItem(namespace+key,value);
          localStorage.setItem(namespace+key+':saved-at',String(savedAt));
        } catch {}
      }
    }
  } catch { db = null; }

  function writeBackup(key, value, recover) {
    if (!db && !globalThis.indexedDB) return null;
    const record = {key:namespace+key, value, recover, savedAt:timestamps.get(key)||0};
    return (db ? Promise.resolve(db) : openDatabase().then(opened => db=opened)).then(connection => transaction(connection, 'readwrite', store => store.put(record)))
      .catch(async () => {
        // Safari can close a database connection after suspending the app.
        db = await openDatabase();
        if (values.get(key) === value) {
          await transaction(db, 'readwrite', store => store.put(record));
        }
      });
  }

  for (const [key, value] of values) {
    if (!readOnly&&!existingBackups.has(key)) writeBackup(key, value, false)?.catch(() => {});
  }
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      if(readOnly)throw Error('此工作區以唯讀方式開啟');
      values.set(key, value);
      const savedAt=Math.max(Date.now(),(timestamps.get(key)||0)+1);
      timestamps.set(key,savedAt);
      let savedLocally = false;
      try { localStorage.setItem(namespace+key, value); savedLocally = true; localStorage.setItem(namespace+key+':saved-at',String(savedAt)); } catch {}
      const backup = writeBackup(key, value, !savedLocally);
      if (!savedLocally && !backup) throw Error('瀏覽器儲存空間無法使用');
      if(savedLocally){backup?.catch(()=>{});return Promise.resolve(true);}
      return backup.then(()=>true,error=>{onSaveError(error);return false;});
    }
  };
}
