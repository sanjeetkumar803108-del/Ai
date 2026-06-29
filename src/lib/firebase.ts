import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use standard Firestore initialization
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
    console.log('Verifying Firebase connection to database:', dbId);
    
    // Check if we can hit the test path
    const testDoc = doc(db, 'test', 'connection');
    try {
      await getDocFromServer(testDoc);
      console.log('Firebase connection verified (Server)');
    } catch (e: any) {
      console.warn('getDocFromServer failed, trying local getDoc...', e.message);
      await getDoc(testDoc);
      console.log('Firebase connection verified (Local/Cache)');
    }
  } catch (error: any) {
    console.warn('Firebase Connection Test Failed CODE:', error.code);
    console.warn('Firebase Connection Test Failed MSG:', error.message);
    
    if (error.code === 'permission-denied') {
      console.warn("PERMISSION ERROR: The database might be in locked mode or rules are not allowing this path.");
    }
    
    if (error.code === 'unavailable') {
      console.info("Firestore backend is unreachable (offline/sandboxed). This may be due to network restrictions or database provisioning lag.");
    }
  }
}
