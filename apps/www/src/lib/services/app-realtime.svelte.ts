import { createNanoEvents, type Emitter } from '@duydang2311/jsbelt';
import type { ClientMessages, ServerMessages } from '@repo/app';
import { getContext, setContext } from 'svelte';

type AppEvents = { [K in keyof ServerMessages]: (payload: ServerMessages[K]['payload']) => void };

export class AppRealtime {
    #emitter: Emitter<AppEvents>;
    #ws: WebSocket;

    constructor(ws: WebSocket) {
        this.#emitter = createNanoEvents<AppEvents>();
        this.#ws = ws;
        this.#ws.addEventListener('message', this.#handleMessage);
    }

    send<K extends keyof ClientMessages>(
        event: K,
        ...args: ClientMessages[K]['payload'] extends never
            ? []
            : [payload: ClientMessages[K]['payload']]
    ) {
        const payload = args[0];
        if (payload) {
            this.#ws.send(JSON.stringify({ type: event, payload }));
        } else {
            this.#ws.send(JSON.stringify({ type: event }));
        }
    }

    on<K extends keyof AppEvents>(event: K, handler: AppEvents[K]) {
        return this.#emitter.on(event, handler);
    }

    dispose() {
        this.#ws.removeEventListener('message', this.#handleMessage);
        this.#ws.close();
    }

    #handleMessage = (event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data);
            this.#emitter.emit(message.type, message.payload);
        } catch (error) {
            console.error('Failed to parse websocket message:', error);
        }
    };
}

const key = {};
export function setAppRealtime(wsClient: AppRealtime | null) {
    let current = $state.raw(wsClient);
    return setContext(key, {
        get current() {
            return current;
        },
        set current(value) {
            current = value;
        }
    });
}

export function useAppRealtime() {
    return (getContext(key) as ReturnType<typeof setAppRealtime>).current;
}
