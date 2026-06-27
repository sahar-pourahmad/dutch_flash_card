import { openDB } from 'idb';

const DB_NAME = 'dutch-words';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('words')) {
          db.createObjectStore('words', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveWords(words) {
  const db = await getDB();
  const tx = db.transaction('words', 'readwrite');
  await Promise.all(words.map(w => tx.store.put(w)));
  await tx.done;
}

export async function getWords() {
  const db = await getDB();
  return db.getAll('words');
}

export async function getProgress(id) {
  const db = await getDB();
  return db.get('progress', id);
}

export async function saveProgress(progress) {
  const db = await getDB();
  return db.put('progress', progress);
}

export async function getAllProgress() {
  const db = await getDB();
  return db.getAll('progress');
}

export async function getMeta(key) {
  const db = await getDB();
  const record = await db.get('meta', key);
  return record?.value;
}

export async function setMeta(key, value) {
  const db = await getDB();
  return db.put('meta', { key, value });
}
