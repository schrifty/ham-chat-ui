import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
	getAuth,
	browserLocalPersistence,
	setPersistence,
	onAuthStateChanged,
	type Auth,
	type User,
} from "firebase/auth";
import { browser } from "$app/environment";
import { user } from "./stores/auth";

// Initialize Firebase and set up auth persistence
const initFirebase = async (): Promise<{ app: FirebaseApp | null; auth: Auth | null }> => {
	if (!browser || typeof window === "undefined") {
		return { app: null, auth: null };
	}

	const firebaseConfig = {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
	};

	// Get existing app or create new one
	const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
	const auth = getAuth(app);

	// Set persistence before any auth operations
	await setPersistence(auth, browserLocalPersistence);

	// Set up auth state listener
	onAuthStateChanged(auth, (userData: User | null) => {
		user.set(userData);
	});

	return { app, auth };
};

// Initialize Firebase and export the instances
const { app, auth } = await initFirebase();

export { app, auth };
