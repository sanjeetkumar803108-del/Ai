import { collection, getDocs, getDoc, doc, setDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Scheme } from '../types';
import { SCHEMES as STATIC_SCHEMES } from '../constants';

const SCHEMES_COLLECTION = 'schemes';

export const schemeSyncService = {
  /**
   * Fetches all schemes from Firestore and returns them.
   * If offline, this will return the cached version from IndexDB.
   */
  async getAllSchemes(): Promise<Scheme[]> {
    try {
      const schemesRef = collection(db, SCHEMES_COLLECTION);
      const snapshot = await getDocs(schemesRef);
      
      if (snapshot.empty) {
        console.log('No schemes found in Firestore, using static data.');
        return STATIC_SCHEMES;
      }

      const schemes: Scheme[] = [];
      snapshot.forEach((doc) => {
        schemes.push({ id: doc.id, ...doc.data() } as Scheme);
      });
      
      return schemes;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, SCHEMES_COLLECTION);
      return STATIC_SCHEMES; // Fallback
    }
  },

  /**
   * Seeds the Firestore collection with initial data from constants.ts
   * Only use this for initial setup or admin updates.
   */
  async seedInitialSchemes() {
    try {
      console.log('Seeding initial schemes to Firestore...');
      for (const scheme of STATIC_SCHEMES) {
        const schemeRef = doc(db, SCHEMES_COLLECTION, scheme.id);
        const existing = await getDoc(schemeRef);
        
        if (!existing.exists()) {
          await setDoc(schemeRef, {
            ...scheme,
            lastSynced: Timestamp.now()
          });
        }
      }
      console.log('Seeding completed.');
    } catch (error) {
      console.error('Error seeding schemes:', error);
    }
  }
};
