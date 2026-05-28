<script lang="ts">
    import { page } from '$app/state';
    import { env } from '$env/dynamic/public';
    import { AppRealtime, setAppRealtime } from '$lib/services/app-realtime.svelte';
    import { setPlayerStore, SveltePlayerStore } from '$lib/utils/player.svelte';
    import { combine, guardNull } from '@duydang2311/jsbelt';
    import { onMount } from 'svelte';
    import { addTrack, getTracks } from './__page__/page.remote';
    import SoundCloudPlayer from './__page__/SoundCloudPlayer.svelte';

    const playerStore = setPlayerStore(new SveltePlayerStore());
    const appRealtime = setAppRealtime(null);
    const tracksQuery = $derived(getTracks());
    let selectedTrackId = $state.raw<string | null>(null);
    let selectedTrack = $derived(
        selectedTrackId
            ? (tracksQuery.current?.find((a) => a.id === selectedTrackId) ?? null)
            : null
    );

    onMount(() => {
        guardNull(page.params.roomId);
        const client = new AppRealtime(
            new WebSocket(`${env.PUBLIC_ROOM_WS_URL}/rooms/${page.params.roomId}`)
        );
        appRealtime.current = client;
        return combine(
            client.on('SELECT_TRACK', ({ trackId }) => {
                playerStore.position = 0;
                playerStore.status = 'loading';
                selectedTrackId = trackId;
            }),
            client.on('PLAYBACK_STATE', (payload) => {
                selectedTrackId = payload.currentTrackId;
                playerStore.position = payload.positionMs;
                playerStore.volume = payload.volume;
                playerStore.startedAtMs = payload.startedAtMs;
                if (payload.currentTrackId) {
                    playerStore.status = 'loading';
                }
            }),
            () => {
                client.dispose();
            }
        );
    });
</script>

<main class="p-4">
    <div class="max-w-5xl mx-auto">
        <form
            {...addTrack.enhance(async (form) => {
                await form.submit();
            })}
        >
            <input {...addTrack.fields.url.as('url')} type="url" placeholder="Enter track URL" />
            <button type="submit">Add track</button>
        </form>
        {#if tracksQuery.current}
            <ol>
                {#each tracksQuery.current as track (track.id)}
                    <li>
                        <button
                            type="button"
                            class="c-button c-button--base"
                            onclick={() => {
                                guardNull(appRealtime.current);
                                appRealtime.current.send('SELECT_TRACK', { trackId: track.id });
                            }}
                        >
                            {track.url}
                        </button>
                    </li>
                {/each}
            </ol>
        {/if}

        {#if selectedTrack}
            {#if selectedTrack.kind === 'soundcloud'}
                <SoundCloudPlayer track={selectedTrack} />
            {:else if selectedTrack.kind === 'youtube'}
                <!-- TODO: <YouTubePlayer track={selectedTrack} /> -->
            {/if}
        {/if}
    </div>
</main>
