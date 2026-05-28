export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'GET') {
			return new Response(null, { status: 404 });
		}

		const url = new URL(request.url);
		let trackUrl = url.searchParams.get('track_url')?.replace(/\/$/, '');
		if (!trackUrl) {
			return new Response(null, { status: 400 });
		}

		const match = trackUrl.match(/^https?:\/\/(www\.)?soundcloud\.com\/[^/]+\/[^/?#]+/i);
		if (!match) {
			return new Response(null, { status: 400 });
		}

		trackUrl = match[0] as string;
		const cache = caches.default;
		const cacheKey = new URL(url.pathname, url.origin);
		cacheKey.searchParams.set('track_url', trackUrl);
		let resp = await cache.match(cacheKey);
		if (resp) {
			return resp;
		}

		resp = await fetch(trackUrl, { method: 'GET' });
		const html = await resp.text();
		const durationMatch = html.match(/"duration":(\d+)/);
		const waveformMatch = html.match(/"waveform_url":"(.+\.json)"/);
		const durationRaw = durationMatch?.[1];
		resp = Response.json(
			{
				duration: durationRaw ? Number(durationRaw) : Number.MAX_SAFE_INTEGER,
				waveformUrl: waveformMatch?.[1] ?? null,
			},
			{
				status: 200,
				headers: {
					'Cache-Control': 'public, max-age=3600',
				},
			},
		);
		ctx.waitUntil(cache.put(cacheKey, resp.clone()));
		return resp;
	},
} satisfies ExportedHandler<Env>;
