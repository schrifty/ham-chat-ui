import { browser } from "$app/environment";
import type { FirebaseApp } from "firebase/app";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { writable } from "svelte/store";

export const user = writable<User | null>(null);

// Initialize these as null and only set them in the browser
let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

// Only run Firebase initialization code in the browser
if (browser && typeof window !== "undefined") {
	// Ensure this code only runs once in the browser
	if (!app && !auth) {
		const firebaseConfig = {
			apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
			authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
			projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
		};

		// Get existing app or create new one
		app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
		auth = getAuth(app);

		// Only set up auth state listener in the browser
		auth.onAuthStateChanged((userData) => {
			user.set(userData);
		});
	}
}

export const signIn = async (email: string, password: string) => {
	if (!auth) throw new Error("Auth not initialized");
	await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
	if (!auth) throw new Error("Auth not initialized");
	await signOut(auth);
};
