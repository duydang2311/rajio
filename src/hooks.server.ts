import { authHandle } from '$lib/utils/jwt';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = authHandle;
