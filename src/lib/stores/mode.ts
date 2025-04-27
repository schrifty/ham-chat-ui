import { writable } from "svelte/store";

export type Mode = "individual" | "team";
export const modeStore = writable<Mode>("individual");
