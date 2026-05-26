import { getRequestEvent, query } from '$app/server';
import { guardNull } from '@duydang2311/jsbelt';
import { error } from '@sveltejs/kit';
import type { User, UserRow } from './model';

export const getUser = query(async () => {
    const e = getRequestEvent();
    if (!e.locals.session) {
        return error(401);
    }

    guardNull(e.platform);
    const row = (await e.platform.env.DB.prepare(
        'SELECT id, created_at, display_name FROM users WHERE id = ?'
    )
        .bind(e.locals.session.userId)
        .first()) as UserRow | null;
    if (!row) {
        return error(404);
    }

    const user: User = {
        id: row.id,
        createdAt: row.created_at,
        displayName: row.display_name
    };
    return user;
});
