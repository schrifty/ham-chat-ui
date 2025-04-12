import { writable } from 'svelte/store';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

function createAuthStore() {
    const { subscribe, set } = writable({
        user: null,
        loading: true
    });

    onAuthStateChanged(auth, (user) => {
        set({ user, loading: false });
    });

    return {
        subscribe,
        signup: async (email, password) => {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                return userCredential.user;
            } catch (error) {
                throw error;
            }
        },
        login: async (email, password) => {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                return userCredential.user;
            } catch (error) {
                throw error;
            }
        },
        logout: async () => {
            try {
                await signOut(auth);
            } catch (error) {
                throw error;
            }
        }
    };
}

export const authStore = createAuthStore();
