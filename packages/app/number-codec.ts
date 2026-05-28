import Sqids from 'sqids';

export class NumberCodec {
    #sqids: Sqids;

    constructor(alphabet: string) {
        this.#sqids = new Sqids({ minLength: 6, alphabet });
    }

    encode(number: number) {
        return this.#sqids.encode([number]);
    }

    decode(id: string) {
        return this.#sqids.decode(id)[0];
    }
}

export function encode(alphabet: string, number: number) {
    return new NumberCodec(alphabet).encode(number);
}

export function decode(alphabet: string, id: string) {
    return new NumberCodec(alphabet).decode(id);
}
