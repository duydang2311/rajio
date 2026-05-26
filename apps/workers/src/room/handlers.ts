import { handler } from '../lib/handler';

export const connectRoomWebSocket = handler<{ id: string }>(async (req, env, ctx, params) => {
    const upgradeHeader = req.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected header: "Upgrade: websocket"', {
            status: 426
        });
    }

    const room = env.ROOMS.getByName(params.id);
    return await room.fetch(req);
});
