import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure the data directory and db.json exist
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
    const initialData = {
        users: [
            { id: '1', name: 'Admin', email: 'admin@vocal-sync.com', password: 'admin', role: 'ADMIN' }
        ],
        settings: [
            { key: 'ELEVENLABS_API_KEY', value: process.env.ELEVENLABS_API_KEY || '' },
            { key: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY || '' },
            { key: 'HUGGINGFACE_API_KEY', value: process.env.HUGGINGFACE_API_KEY || '' },
            { key: 'DEEPGRAM_API_KEY', value: process.env.DEEPGRAM_API_KEY || '' },
            { key: 'MURF_API_KEY', value: process.env.MURF_API_KEY || '' },
            { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '' },
            { key: 'ASSEMBLYAI_API_KEY', value: process.env.ASSEMBLYAI_API_KEY || '' },
            { key: 'FILE_SIZE_LIMIT_MB', value: '25' },
            { key: 'CONCURRENT_USERS_LIMIT', value: '5' }
        ],
        history: [],
        cache: {}
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

export const getDb = () => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

export const saveDb = (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

export const getSetting = (key: string) => {
    const db = getDb();
    return db.settings.find((s: any) => s.key === key)?.value || '';
};

export const updateSetting = (key: string, value: string) => {
    const db = getDb();
    const index = db.settings.findIndex((s: any) => s.key === key);
    if (index !== -1) {
        db.settings[index].value = value;
    } else {
        db.settings.push({ key, value });
    }
    saveDb(db);
};

export const addUser = (user: any) => {
    const db = getDb();
    db.users.push(user);
    saveDb(db);
};

export const removeUser = (id: string) => {
    const db = getDb();
    db.users = db.users.filter((u: any) => u.id !== id);
    saveDb(db);
};

export const getHistory = () => {
    const db = getDb();
    return db.history || [];
};

export const addToHistory = (item: any) => {
    const db = getDb();
    if (!db.history) db.history = [];
    db.history.unshift({ ...item, timestamp: new Date().toISOString() });
    // Keep only last 100 items
    if (db.history.length > 100) db.history = db.history.slice(0, 100);
    saveDb(db);
};

export const getCache = (key: string) => {
    const db = getDb();
    return db.cache?.[key] || null;
};

export const setCache = (key: string, value: any) => {
    const db = getDb();
    if (!db.cache) db.cache = {};
    db.cache[key] = value;
    saveDb(db);
};
