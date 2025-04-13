import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { browser } from "$app/environment";

let app: FirebaseApp;
let auth: Auth;

if (browser) {
	const firebaseConfig = {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	};

	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
}

export { app, auth };
