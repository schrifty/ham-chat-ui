import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { browser } from "$app/environment";

// Initialize these as null and only set them in the browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

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
	}
}

export { app, auth };
