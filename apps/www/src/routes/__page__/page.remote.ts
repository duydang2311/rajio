import { resolve } from '$app/paths';
import { form, getRequestEvent } from '$app/server';
import { encode } from '$lib/utils/number-codec';
import { guardNull } from '@duydang2311/jsbelt';
import { error, redirect } from '@sveltejs/kit';

export const createRoom = form(async () => {
    const e = getRequestEvent();
    if (!e.locals.session) {
        return error(401);
    }

    guardNull(e.platform);
    const row = (await e.platform.env.DB.prepare(
        'INSERT INTO rooms (owner_id) VALUES (?) RETURNING id'
    )
        .bind(e.locals.session.userId)
        .first()) as { id: number } | null;
    if (!row) {
        return error(500);
    }

    return redirect(303, resolve('/rooms/[roomId]', { roomId: encode(row.id) }));
});
