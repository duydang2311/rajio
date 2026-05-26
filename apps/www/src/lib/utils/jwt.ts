import { env } from '$env/dynamic/private';
import { guardNull } from '@duydang2311/jsbelt';
import type { Handle } from '@sveltejs/kit';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';

export async function sign(sub: string) {
    const alg = 'EdDSA';
    const privateKey = await importPKCS8(env.AUTH_KEY_PRIVATE.replace(/\\n/g, '\n'), alg);
    const jwt = await new SignJWT({ sub })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer('rajio-www')
        .setAudience('rajio-client')
        .setExpirationTime('1d')
        .sign(privateKey);
    return jwt;
}

export async function verify(jwt: string) {
    const publicKey = await importSPKI(env.AUTH_KEY_PUBLIC.replace(/\\n/g, '\n'), 'EdDSA');
    return await jwtVerify(jwt, publicKey, {
        issuer: 'rajio-www',
        audience: 'rajio-client'
    });
}

export const authHandle: Handle = async ({ event, resolve }) => {
    const jwt = event.cookies.get('session_token');
    if (jwt) {
        try {
            const result = await verify(jwt);
            guardNull(result.payload.sub);
            event.locals.session = { userId: result.payload.sub };
        } catch {
            event.cookies.delete('session_token', { path: '/' });
        }
    }
    return await resolve(event);
};
