import { writable } from "svelte/store";
import type { Prompt } from "$lib/types/Prompt";
import { base } from "$app/paths";

async function loadPrompts() {
	try {
		const response = await fetch(`${base}/api/prompts`);
		if (!response.ok) {
			throw new Error("Failed to load prompts");
		}
		const prompts: Prompt[] = await response.json();
		promptsStore.set(prompts);
	} catch (error) {
		console.error("Error loading prompts:", error);
		promptsStore.set([]);
	}
}

export const promptsStore = writable<Prompt[]>([]);

// Load prompts when the store is first imported
loadPrompts();
