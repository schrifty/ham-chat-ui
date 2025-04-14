import { auth } from "$lib/firebase";
import { signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { writable } from "svelte/store";

// Create a writable store for the user
export const user = writable<User | null>(null);

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
	if (!auth) throw new Error("Auth not initialized");
	return signInWithEmailAndPassword(auth, email, password);
};

// Sign out the current user
export const signOutUser = async () => {
	if (!auth) throw new Error("Auth not initialized");
	return signOut(auth);
};
