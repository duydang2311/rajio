import { form, getRequestEvent, query, requested } from '$app/server';
import { env } from '$env/dynamic/private';
import { decode, encode } from '$lib/utils/number-codec';
import { guardNull } from '@duydang2311/jsbelt';
import type { TrackDto, TrackRow } from '@repo/app';
import { error } from '@sveltejs/kit';
import { type } from 'arktype';

export const addTrack = form(
    type({
        url: 'string.url'
    }),
    async (data) => {
        const e = getRequestEvent();
        if (!e.locals.session) {
            return error(401);
        }
        guardNull(e.platform);
        guardNull(e.params.roomId);
        const resp = await e.platform.env.SOUNDCLOUD_SCRAPER.fetch(
            `${env.SOUNDCLOUD_SCRAPER_API_URL}/?track_url=${encodeURIComponent(data.url)}`
        );
        let duration = Number.MAX_SAFE_INTEGER;
        if (resp.status === 200) {
            const body = (await resp.json()) as { duration: number; waveformUrl: string | null };
            duration = body.duration;
        }
        await e.platform.env.DB.prepare(
            'INSERT INTO tracks (room_id, creator_id, kind, url, duration) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(
                decode(e.params.roomId),
                e.locals.session.userId,
                'soundcloud',
                data.url,
                duration
            )
            .raw();
        await requested(getTracks, 1).refreshAll();
        return { success: true };
    }
);

export const getTracks = query(async () => {
    const e = getRequestEvent();
    if (!e.locals.session) {
        return error(401);
    }
    guardNull(e.platform);
    guardNull(e.params.roomId);
    const resp = await e.platform.env.DB.prepare(
        'SELECT id, creator_id, kind, url FROM tracks WHERE room_id = ? LIMIT 50'
    )
        .bind(decode(e.params.roomId))
        .all();
    const rows = resp.results as Pick<TrackRow, 'id' | 'creator_id' | 'kind' | 'url'>[];
    const tracks = rows.map(
        (a) =>
            ({
                id: encode(a.id),
                creatorId: a.creator_id,
                kind: a.kind,
                url: a.url
            }) as Pick<TrackDto, 'id' | 'creatorId' | 'kind' | 'url'>
    );
    return tracks;
});
