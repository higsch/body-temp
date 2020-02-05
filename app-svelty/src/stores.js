import { writable } from 'svelte/store';

export const width = writable(undefined);
export const height = writable(undefined);

export const numExpandedIndividuals = writable(0);
