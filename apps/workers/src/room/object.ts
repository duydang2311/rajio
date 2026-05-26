import { DurableObject } from 'cloudflare:workers';
import { getPath } from 'hono/utils/url';

declare global {
    interface Env {
        ROOMS: DurableObjectNamespace<Room>;
    }
}

export class Room extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    async fetch(request: Request) {
        const segments = getPath(request).split('/', 3);
        const roomId = segments[2];
        return await this.#join(roomId);
    }

    async #join(roomId: string): Promise<Response> {
        const { 0: client, 1: server } = new WebSocketPair();
        this.ctx.acceptWebSocket(server);
        server.serializeAttachment({
            roomId,
            joinedAt: Date.now()
        });
        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
        ws.send(
            `[Durable Object] message: ${message}, connections: ${this.ctx.getWebSockets().length}`
        );
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
        // With web_socket_auto_reply_to_close (compat date >= 2026-04-07), the runtime
        // auto-replies to Close frames. Calling close() is safe but no longer required.
        ws.close(code, reason);
    }
}
