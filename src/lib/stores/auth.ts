import { browser } from "$app/environment";
import type { FirebaseApp } from "firebase/app";
import { initializeApp, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { writable } from "svelte/store";

function handleFirebaseError(error: unknown): void {
	if (!(error instanceof Error)) {
		throw error;
	}
	if (!("code" in error)) {
		throw error;
	}
	if (error.code !== "app/duplicate-app") {
		throw error;
	}
}

export const user = writable<User | null>(null);

let auth: ReturnType<typeof getAuth> | null = null;

if (browser) {
	const firebaseConfig = {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
	};

	console.log("Firebase Config:", {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	});

	let app: FirebaseApp;
	try {
		app = initializeApp(firebaseConfig);
	} catch (error: unknown) {
		handleFirebaseError(error);
		app = getApp();
	}
	auth = getAuth(app);

	auth.onAuthStateChanged((userData) => {
		user.set(userData);
	});
}

export const signIn = async (email: string, password: string) => {
	if (!auth) throw new Error("Auth not initialized");
	await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
	if (!auth) throw new Error("Auth not initialized");
	await signOut(auth);
};
