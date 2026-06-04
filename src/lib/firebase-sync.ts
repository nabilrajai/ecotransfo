import { collection, doc, getDocs, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './firebase';
import { INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_LOTS, INITIAL_TASKS } from './seed-data';
import firebaseConfig from '../../firebase-applet-config.json';

const isFirebasePlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('remixed');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  if (isFirebasePlaceholder) {
    console.log('[Firebase] Running in offline placeholder mode.');
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection is online and working.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Call testConnection on startup
testConnection();

export const STORAGE_KEYS = {
  USER: 'ecotransfo_user',
  PROJECTS: 'ecotransfo_projects',
  LOTS: 'ecotransfo_lots',
  TASKS: 'ecotransfo_tasks',
  BUDGET: 'ecotransfo_budget',
  NOTIFICATIONS: 'ecotransfo_notifications',
  DOCUMENTS: 'ecotransfo_documents',
  MESSAGES: 'ecotransfo_messages',
  USERS: 'ecotransfo_users_list',
  CLIENTS: 'ecotransfo_clients_list',
  ACTIVITY_LOGS: 'ecotransfo_activity_logs_list',
  ACOMPTES: 'ecotransfo_acomptes_list',
  FEEDBACK: 'ecotransfo_project_feedback_list'
};

const collectionsMap: Record<string, string> = {
  PROJECTS: 'projects',
  LOTS: 'lots',
  TASKS: 'tasks',
  BUDGET: 'projects_budget', // Note: rule is projects/{projectId}/budget?
  NOTIFICATIONS: 'notifications',
  DOCUMENTS: 'projectDocuments',
  MESSAGES: 'projectMessages',
  USERS: 'users',
  CLIENTS: 'clients',
  ACTIVITY_LOGS: 'activityLogs',
  ACOMPTES: 'acomptes',
  FEEDBACK: 'projectFeedbacks'
};

function mergeLocalAndRemote<T extends { id: string; uid?: string; updatedAt?: string; createdAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const mergedMap = new Map<string, T>();
  
  // Add all local items first
  for (const item of local) {
    const id = item.id || item.uid;
    if (id) {
      mergedMap.set(id, item);
    }
  }
  
  // Merge remote items, keeping whichever is newer if there is a conflict
  for (const item of remote) {
    const id = item.id || item.uid;
    if (!id) continue;
    
    if (mergedMap.has(id)) {
      const existing = mergedMap.get(id)!;
      const remoteTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      
      if (remoteTime >= localTime) {
        mergedMap.set(id, item);
      }
    } else {
      mergedMap.set(id, item);
    }
  }
  
  return Array.from(mergedMap.values());
}

export async function loadAllDataFromFirebase() {
  if (isFirebasePlaceholder) {
    console.log('[FirebaseSync] Running in offline placeholder mode. Seeding local storage if required.');
    Object.entries(collectionsMap).forEach(([key, collName]) => {
      const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
      const localData = localStorage.getItem(storageKey);
      if (!localData || JSON.parse(localData).length === 0) {
        let seedData: any[] = [];
        if (key === 'PROJECTS') seedData = INITIAL_PROJECTS;
        else if (key === 'CLIENTS') seedData = INITIAL_CLIENTS;
        else if (key === 'LOTS') seedData = INITIAL_LOTS;
        else if (key === 'TASKS') seedData = INITIAL_TASKS;
        if (seedData.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(seedData));
        }
      }
    });
    return;
  }
  try {
    const promises = Object.entries(collectionsMap).map(async ([key, collName]) => {
      const q = collection(db, collName);
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, collName);
        throw err;
      }
      console.log(`[FirebaseSync] Fetched ${snapshot.size} docs for ${collName}`);
      let data = snapshot.docs.map(doc => {
        const docData = doc.data();
        
        // Convert any Firebase Timestamps to ISO strings
        Object.keys(docData).forEach(k => {
          if (docData[k] && typeof docData[k].toDate === 'function') {
            docData[k] = docData[k].toDate().toISOString();
          }
        });

        return {
          id: doc.id,
          ...(collName === 'users' ? { uid: doc.id } : {}),
          ...docData
        };
      });
      
      // If collection is empty, and it is a seedable collection, perform auto-seeding
      if (data.length === 0) {
        let seedData: any[] = [];
        if (key === 'PROJECTS') seedData = INITIAL_PROJECTS;
        else if (key === 'CLIENTS') seedData = INITIAL_CLIENTS;
        else if (key === 'LOTS') seedData = INITIAL_LOTS;
        else if (key === 'TASKS') seedData = INITIAL_TASKS;

        if (seedData.length > 0) {
          console.log(`Auto-seeding empty Firestore collection "${collName}" with standard datasets`);
          for (const item of seedData) {
            try {
              await setDoc(doc(db, collName, item.id), item);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `${collName}/${item.id}`);
              throw err;
            }
          }
          data = seedData;
        }
      }
      
      // Directly sync from Database - No stale local storage merges
      localStorage.setItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS], JSON.stringify(data));
    });

    const results = await Promise.allSettled(promises);
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
         console.error(`Firebase sync failed for collection ${Object.keys(collectionsMap)[idx]}`, result.reason);
      }
    });
  } catch (err) {
    console.error('Firebase sync failed, using local data', err);
  }
}

export async function syncToFirebase(collectionKey: string, id: string, data: any) {
  if (isFirebasePlaceholder) return;
  if (!id) {
    console.warn(`[syncToFirebase] Skipping sync for ${collectionKey}: id is missing/undefined. Data:`, data);
    return;
  }
  const collName = collectionsMap[collectionKey];
  try {
    if (collName) {
      await setDoc(doc(db, collName, id), data, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collName}/${id}`);
  }
}

export async function deleteFromFirebase(collectionKey: string, id: string) {
  if (isFirebasePlaceholder) return;
  const collName = collectionsMap[collectionKey];
  try {
    if (collName) {
      await deleteDoc(doc(db, collName, id));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collName}/${id}`);
  }
}
