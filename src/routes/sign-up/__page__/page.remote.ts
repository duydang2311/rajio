import { form, getRequestEvent, query } from '$app/server';
import { sign } from '$lib/utils/jwt';
import { guardNull } from '@duydang2311/jsbelt';
import { error, redirect } from '@sveltejs/kit';
import { type } from 'arktype';

export const signUp = form(
	type({
		displayName: 'string > 0'
	}),
	async (data) => {
		const e = getRequestEvent();
		guardNull(e.platform);

		const resp = await e.platform.env.DB.prepare(
			'INSERT INTO users (id, display_name) VALUES (?, ?) RETURNING id;'
		)
			.bind(crypto.randomUUID(), data.displayName)
			.run();
		if (!resp.success) {
			return error(500);
		}
		const result = resp.results[0];
		const id = result.id as string;
		guardNull(result);
		guardNull(result.id);
		e.cookies.set('session_token', await sign(id), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 1 * 24 * 60 * 60
		});
		return redirect(303, e.url.searchParams.get('back') ?? '/');
	}
);

export const getRooms = query(async () => {
	const e = getRequestEvent();
	guardNull(e.platform);
});
