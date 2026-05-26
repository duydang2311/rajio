<script lang="ts">
    import { page } from '$app/state';
    import { env } from '$env/dynamic/public';
    import { guardNull } from '@duydang2311/jsbelt';
    import { onMount } from 'svelte';

    let ws!: WebSocket;
    onMount(() => {
        guardNull(page.params.roomId);
        const roomWsUrl = new URL(`/rooms/${page.params.roomId}`, env.PUBLIC_ROOM_WS_URL);
        ws = new WebSocket(roomWsUrl);

        ws.onopen = () => {
            console.log('Connected');
            ws.send('Hello');
        };

        ws.onmessage = (event) => {
            console.log('Received:', event.data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = (event) => {
            console.log(`Closed: ${event.code} ${event.reason}`);
        };
        return () => {
            ws.close();
        };
    });
</script>
