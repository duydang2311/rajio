import { authHandle } from '$lib/utils/jwt';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const privateRouteHandle: Handle = ({ event, resolve }) => {
    if (event.route.id?.includes('(private)') && !event.locals.session) {
        return redirect(303, '/');
    }
    return resolve(event);
};

export const handle: Handle = sequence(authHandle, privateRouteHandle);
