import { env } from '$env/dynamic/private';
import Sqids from 'sqids';

export function encode(number: number) {
    return new Sqids({ minLength: 6, alphabet: env.NUMBER_CODEC_ALPHABET }).encode([number]);
}

export function decode(id: string) {
    return new Sqids({ minLength: 6, alphabet: env.NUMBER_CODEC_ALPHABET }).decode(id)[0];
}
