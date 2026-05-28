import { decode } from '@repo/app';
import { handler } from '../lib/handler';

export const connectRoomWebSocket = handler<{ id: string }>(async (req, env, ctx, params) => {
    const upgradeHeader = req.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected header: "Upgrade: websocket"', {
            status: 426
        });
    }

    const roomId = decode(env.NUMBER_CODEC_ALPHABET, params.id)
    const room = env.ROOMS.getByName(roomId.toString());
    return await room.fetch(req);
});
