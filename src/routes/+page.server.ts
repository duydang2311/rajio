import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (e) => {
	if (!e.locals.session) {
		const url = new URL('/sign-up', e.url);
		url.searchParams.set('back', '/');
		return redirect(303, url);
	}
};
