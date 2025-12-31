import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

// Helper to check if a user is logged in (Local storage check for persistence in this session)
export const getCurrentUser = async (): Promise<UserProfile | undefined> => {
  // Since Firestore is async and stateless regarding "current session" without Auth,
  // we can check localStorage to see if we saved a user ID from a previous login.
  const storedId = localStorage.getItem('sparkle_current_user_id');
  if (!storedId) return undefined;

  // Verify this ID still exists in cloud
  // Note: For a real production app, use onAuthStateChanged. 
  // Here we just fetch the user doc if we have the ID locally.
  const q = query(collection(db, USERS_COLLECTION), where('__name__', '==', storedId)); // __name__ is doc ID
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const docData = snapshot.docs[0].data() as Omit<UserProfile, 'id'>;
    return { id: snapshot.docs[0].id, ...docData };
  }
  
  return undefined;
};

// Helper to register a user
export const registerUser = async (profile: UserProfile): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), profile);
    // Save to local storage so we remember them next refresh
    localStorage.setItem('sparkle_current_user_id', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

// Helper to login a user
export const loginUser = async (name: string, birthday: string): Promise<UserProfile | undefined> => {
  try {
    // Query Firestore for matching Name AND Birthday
    const q = query(
      collection(db, USERS_COLLECTION), 
      where("name", "==", name),
      where("birthday", "==", birthday)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;
      const profile = { ...userData, id: userDoc.id };
      
      // Save to local storage
      localStorage.setItem('sparkle_current_user_id', userDoc.id);
      
      return profile;
    }
    return undefined;
  } catch (e) {
    console.error("Error logging in: ", e);
    throw e;
  }
};

// Helper to update a user
export const updateUser = async (id: string | number, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, String(id));
    await updateDoc(userRef, updates);
  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('sparkle_current_user_id');
};