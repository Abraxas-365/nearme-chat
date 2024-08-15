import { writable } from 'svelte/store';

export const userIdStore = writable<string | null>(null);
