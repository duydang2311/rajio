export type Handler<Params> = (
    request: Request<unknown, IncomingRequestCfProperties<unknown>>,
    env: Env,
    ctx: ExecutionContext<unknown>,
    params: Params
) => Response | Promise<Response>;

export function handler<T = never>(handler: Handler<T>) {
    return handler;
}
