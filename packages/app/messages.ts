export interface ClientMessagePayloads {
    PLAY: { trackId: string };
    RESUME: never;
    PAUSE: never;
    SET_VOLUME: { volume: number };
    SEEK: { positionMs: number };
}

export interface ServerMessagePayloads {
    PLAY: {
        trackId: string;
        startedAtMs: number;
        positionMs: number;
    };
    RESUME: { positionMs: number };
    PAUSE: { positionMs: number };
    SET_VOLUME: { volume: number };
    PLAYBACK_STATE: {
        currentTrackId: string | null;
        startedAtMs: number | null;
        positionMs: number;
        volume: number;
    };
    SEEK: { positionMs: number };
}

export type ClientMessages = {
    [K in keyof ClientMessagePayloads]: {
        type: K;
        payload: ClientMessagePayloads[K];
    };
};

export type ServerMessages = {
    [K in keyof ServerMessagePayloads]: {
        type: K;
        payload: ServerMessagePayloads[K];
    };
};

export function isClientMessage<K extends keyof ClientMessages>(
    obj: unknown,
    type: K
): obj is ClientMessages[K] {
    return obj != null && typeof obj === 'object' && 'type' in obj && obj.type === type;
}

export function isServerMessage<K extends keyof ClientMessages>(
    obj: unknown,
    type: K
): obj is ClientMessages[K] {
    return obj != null && typeof obj === 'object' && 'type' in obj && obj.type === type;
}
