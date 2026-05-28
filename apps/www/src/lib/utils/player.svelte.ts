import { createContext } from 'svelte';

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlayerStore {
    volume: number;
    position: number;
    status: PlayerStatus;
    startedAtMs: number | null;
}

export const [getPlayerStore, setPlayerStore] = createContext<PlayerStore>();

export class SveltePlayerStore implements PlayerStore {
    volume = $state.raw(1);
    position = $state.raw(0);
    status = $state.raw<PlayerStatus>('idle');
    startedAtMs = $state.raw<number | null>(null);
}
