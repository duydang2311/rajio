export { Room } from './room/object';

import { LinearRouter } from 'hono/router/linear-router';
import { getPath } from 'hono/utils/url';
import { Handler } from './lib/handler';
import { connectRoomWebSocket } from './room/handlers';

const router = new LinearRouter<Handler<any>>();
router.add('GET', '/rooms/:id', connectRoomWebSocket);

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const [result] = router.match('GET', getPath(request));
        if (result.length === 0) {
            return new Response(null, { status: 404 });
        }
        const handler = result[0][0] as Handler<any>;
        return handler(request, env, ctx, result[0][1]);
    }
} satisfies ExportedHandler<Env>;
