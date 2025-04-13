import { writable } from "svelte/store";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { browser } from "$app/environment";

export const user = writable<User | null>(null);

let auth = null;

if (browser) {
	const firebaseConfig = {
		apiKey: "AIzaSyBBK_5EKjt-0ajOTspDRbt7ygMJuN-y4oo",
		authDomain: "smart-chat-3ce88.firebaseapp.com",
		projectId: "smart-chat-3ce88",
	};

	const app = initializeApp(firebaseConfig);
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
