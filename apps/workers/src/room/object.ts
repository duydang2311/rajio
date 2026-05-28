import type { Track, TrackRow } from '@repo/app';
import { ClientMessagePayloads, ClientMessages, decode, encode, ServerMessages } from '@repo/app';
import { DurableObject } from 'cloudflare:workers';
import { migrate } from './migration';

declare global {
    interface Env {
        ROOMS: DurableObjectNamespace<Room>;
    }
}

type PlaybackStateRow = {
    current_track_id: number | null;
    started_at_ms: number | null;
    position_ms: number;
    volume: number;
};

interface PlaybackState {
    currentTrack: Pick<Track, 'id' | 'duration'> | null;
    startedAtMs: number | null;
    positionMs: number;
    volume: number;
}

export class Room extends DurableObject<Env> {
    #sessions = new Map<WebSocket, {}>();
    #playbackState!: PlaybackState;
    #handlers: {
        [K in keyof ClientMessagePayloads]?: ClientMessagePayloads[K] extends never
            ? () => void | Promise<void>
            : (payload: ClientMessagePayloads[K]) => void | Promise<void>;
    } = {
        PLAY: (payload) => this.#handlePlay(payload),
        RESUME: () => this.#handleResume(),
        PAUSE: () => this.#handlePause(),
        SET_VOLUME: (payload) => this.#handleSetVolume(payload),
        SEEK: (payload) => this.#handleSeek(payload)
    };

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        migrate(ctx);
        const row = ctx.storage.sql
            .exec<PlaybackStateRow>('SELECT * FROM playback_states WHERE id = ?', 1)
            .one();
        console.log('constructor row', row);
        if (row.current_track_id != null) {
            this.ctx.blockConcurrencyWhile(async () => {
                const trackId = row.current_track_id;
                const trackRow = await this.env.DB.prepare(
                    'SELECT id, duration FROM tracks WHERE room_id = ? AND id = ?'
                )
                    .bind(this.#roomId, trackId)
                    .first<TrackRow>();
                if (trackRow) {
                    this.#playbackState = {
                        currentTrack: {
                            id: trackRow.id,
                            duration: trackRow.duration
                        },
                        startedAtMs: row.started_at_ms,
                        positionMs: row.position_ms,
                        volume: row.volume
                    };
                } else {
                    this.#playbackState = {
                        currentTrack: null,
                        startedAtMs: null,
                        positionMs: 0,
                        volume: row.volume
                    };
                }
            });
        } else {
            this.#playbackState = {
                currentTrack: null,
                startedAtMs: null,
                positionMs: 0,
                volume: row.volume
            };
        }
        for (const ws of ctx.getWebSockets()) {
            const session = ws.deserializeAttachment();
            this.#sessions.set(ws, { ...session });
        }
        ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    }

    get #roomId() {
        return Number(this.ctx.id.name);
    }

    async fetch(request: Request) {
        return await this.#join();
    }

    async webSocketMessage(sender: WebSocket, message: ArrayBuffer | string) {
        if (typeof message !== 'string') {
            return;
        }

        let obj;
        try {
            obj = JSON.parse(message);
        } catch (e) {
            console.error('failed to parse ws message: ' + e);
            return;
        }
        const handler = this.#handlers[obj.type as keyof ClientMessages];
        if (!handler) {
            console.warn('received unhandled message type: ' + obj.type);
            return;
        }
        const ret = handler(obj.payload);
        if (ret && ret instanceof Promise) {
            await ret;
        }
    }

    webSocketClose(sender: WebSocket, code: number, reason: string, wasClean: boolean) {
        // With web_socket_auto_reply_to_close (compat date >= 2026-04-07), the runtime
        // auto-replies to Close frames. Calling close() is safe but no longer required.
        // however, don't call at all cuz it crashes in some case
        // sender.close(code, reason);
        this.#sessions.delete(sender);
    }

    async alarm() {
        console.log('async alarm()');
        console.log(
            'checking',
            this.#playbackState.currentTrack == null,
            this.#playbackState.startedAtMs == null
        );
        const state = this.#playbackState;
        if (!state.currentTrack || state.startedAtMs == null) {
            return;
        }

        const positionMs = state.positionMs + Date.now() - state.startedAtMs;
        console.log('positionMs', positionMs, 'vs', state.currentTrack.duration);
        if (positionMs < state.currentTrack.duration) {
            this.ctx.storage.setAlarm(
                state.startedAtMs + state.currentTrack.duration - state.positionMs
            );
            return;
        }
        const nextTrack = await this.#getNextTrack(state.currentTrack.id);
        if (nextTrack) {
            this.#play(nextTrack);
        } else {
            this.#clear();
        }
    }

    async #join(): Promise<Response> {
        const { 0: client, 1: server } = new WebSocketPair();
        this.ctx.acceptWebSocket(server);
        const session = {};
        this.#sessions.set(server, session);
        server.serializeAttachment(session);
        this.#send(server, 'PLAYBACK_STATE', {
            currentTrackId: this.#playbackState.currentTrack
                ? encode(this.env.NUMBER_CODEC_ALPHABET, this.#playbackState.currentTrack.id)
                : null,
            startedAtMs: this.#playbackState.startedAtMs,
            positionMs:
                this.#playbackState.startedAtMs == null
                    ? this.#playbackState.positionMs
                    : this.#playbackState.positionMs + Date.now() - this.#playbackState.startedAtMs,
            volume: this.#playbackState.volume
        });

        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    async #handlePlay(payload: ClientMessagePayloads['PLAY']) {
        const trackId = decode(this.env.NUMBER_CODEC_ALPHABET, payload.trackId);
        const row = await this.env.DB.prepare(
            'SELECT id, duration FROM tracks WHERE room_id = ? AND id = ?'
        )
            .bind(this.#roomId, trackId)
            .first<TrackRow>();
        if (!row) {
            return;
        }
        this.#play(row);
    }

    #handleResume() {
        const state = this.#playbackState;
        if (!state.currentTrack || state.startedAtMs != null) {
            return;
        }
        state.startedAtMs = Date.now();
        this.ctx.storage.sql.exec(
            'UPDATE playback_states SET started_at_ms = ? WHERE id = ?',
            state.startedAtMs,
            1
        );
        this.ctx.storage.setAlarm(
            state.startedAtMs + state.currentTrack.duration - state.positionMs
        );
        this.#broadcast('RESUME', {
            positionMs: state.positionMs
        });
    }

    #handlePause() {
        const state = this.#playbackState;
        if (state.currentTrack == null || state.startedAtMs == null) {
            return;
        }
        state.positionMs = Math.min(
            state.positionMs + Date.now() - state.startedAtMs,
            state.currentTrack.duration
        );
        state.startedAtMs = null;
        this.ctx.storage.sql.exec(
            'UPDATE playback_states SET started_at_ms = ?, position_ms = ? WHERE id = ?',
            null,
            state.positionMs,
            1
        );
        this.ctx.storage.deleteAlarm();
        this.#broadcast('PAUSE', {
            positionMs: state.positionMs
        });
    }

    #handleSetVolume(payload: ClientMessages['SET_VOLUME']['payload']) {
        this.#playbackState.volume = Math.max(0, Math.min(payload.volume, 1));
        this.ctx.storage.sql.exec(
            'UPDATE playback_states SET volume = ? WHERE id = ?',
            this.#playbackState.volume,
            1
        );
        this.#broadcast('SET_VOLUME', {
            volume: this.#playbackState.volume
        });
    }

    async #handleSeek(payload: ClientMessages['SEEK']['payload']) {
        const state = this.#playbackState;
        if (!state.currentTrack) {
            return;
        }
        const now = Date.now();
        const positionMs = Math.floor(
            Math.max(0, Math.min(payload.positionMs, state.currentTrack.duration))
        );
        if (state.startedAtMs != null) {
            if (positionMs === state.currentTrack.duration) {
                const nextTrack = await this.#getNextTrack(state.currentTrack.id);
                if (nextTrack) {
                    this.#play(nextTrack);
                } else {
                    this.#clear();
                }
                return;
            } else {
                const finishAt = now + state.currentTrack.duration - positionMs;
                state.startedAtMs = now;
                this.ctx.storage.setAlarm(finishAt);
            }
        }
        state.positionMs = positionMs;
        this.ctx.storage.sql.exec(
            'UPDATE playback_states SET started_at_ms = ?, position_ms = ? WHERE id = ?',
            state.startedAtMs,
            state.positionMs,
            1
        );
        this.#broadcast('SEEK', {
            positionMs: state.positionMs
        });
    }

    #send<K extends keyof ServerMessages>(
        ws: WebSocket,
        event: K,
        payload: ServerMessages[K]['payload']
    ) {
        const message = JSON.stringify({ type: event, payload: payload });
        ws.send(message);
    }

    #broadcast<K extends keyof ServerMessages>(event: K, payload: ServerMessages[K]['payload']) {
        console.log('this.#broadcast', event, payload);
        const message = JSON.stringify({ type: event, payload: payload });
        for (const [ws] of this.#sessions) {
            ws.send(message);
        }
    }

    #getNextTrack(trackId: number) {
        return this.env.DB.prepare(
            `
                SELECT id, duration FROM tracks
                WHERE room_id = ?
                ORDER BY
                    CASE WHEN id > ? THEN 0 ELSE 1 END,
                    id ASC
                LIMIT 1
            `
        )
            .bind(this.#roomId, trackId)
            .first<Pick<TrackRow, 'id' | 'duration'>>();
    }

    #play(track: Pick<TrackRow, 'id' | 'duration'>) {
        const state = this.#playbackState;
        state.currentTrack = track;
        state.startedAtMs = Date.now();
        state.positionMs = 0;
        this.ctx.storage.sql.exec(
            'UPDATE playback_states SET current_track_id = ?, started_at_ms = ?, position_ms = ? WHERE id = ?',
            state.currentTrack?.id ?? null,
            state.startedAtMs,
            state.positionMs,
            1
        );
        this.ctx.storage.setAlarm(
            state.startedAtMs + state.currentTrack.duration - state.positionMs
        );
        this.#broadcast('PLAY', {
            trackId: encode(this.env.NUMBER_CODEC_ALPHABET, state.currentTrack.id),
            startedAtMs: state.startedAtMs,
            positionMs: state.positionMs
        });
    }

    #clear() {
        const state = this.#playbackState;
        state.currentTrack = null;
        state.startedAtMs = null;
        state.positionMs = 0;
        this.ctx.storage.deleteAlarm();
        this.#broadcast('PLAYBACK_STATE', {
            currentTrackId: null,
            startedAtMs: null,
            positionMs: 0,
            volume: state.volume
        });
    }
}
