<script lang="ts">
    import { useAppRealtime } from '$lib/services/app-realtime.svelte';
    import { getPlayerStore } from '$lib/utils/player.svelte';
    import { combine, guardNull } from '@duydang2311/jsbelt';
    import { watch } from '@duydang2311/svutils';
    import type { TrackDto } from '@repo/app';
    import { on } from 'svelte/events';

    interface Props {
        track: Pick<TrackDto, 'id' | 'url'>;
    }

    const { track }: Props = $props();
    const playerStore = getPlayerStore();
    const appRealtime = $derived(useAppRealtime());
    let iframeEl = $state.raw<HTMLIFrameElement>();
    let ready = false;
    let seekDelta: number | null = null;

    function postMessage(source: MessageEventSource, data: unknown) {
        source.postMessage(JSON.stringify(data), {
            targetOrigin: 'https://w.soundcloud.com'
        });
    }

    // watch(() => [iframeEl, ready, playerStore.volume])(() => {
    //     if (!iframeEl || !ready) {
    //         return;
    //     }
    //     guardNull(iframeEl.contentWindow);
    //     postMessage(iframeEl.contentWindow, {
    //         method: 'setVolume',
    //         value: playerStore.volume * 100
    //     });
    // });

    // watch(() => [iframeEl, ready, playerStore.startedAtMs])(() => {
    //     if (!iframeEl || !ready || playerStore.startedAtMs == null) {
    //         return;
    //     }
    //     guardNull(iframeEl.contentWindow);
    //     if (playerStore.status !== 'playing') {
    //         postMessage(iframeEl.contentWindow, { method: 'play' });
    //     }
    // });

    watch(() => appRealtime)(() => {
        if (!appRealtime) {
            return;
        }
        return combine(
            appRealtime.on('PLAY', ({ positionMs }) => {
                playerStore.position = positionMs;
                if (!ready) {
                    return;
                }
                guardNull(iframeEl);
                guardNull(iframeEl.contentWindow);
                postMessage(iframeEl.contentWindow, { method: 'seekTo', value: positionMs });
                postMessage(iframeEl.contentWindow, { method: 'play' });
            }),
            appRealtime.on('PAUSE', ({ positionMs }) => {
                playerStore.position = positionMs;
                if (!ready) {
                    return;
                }
                guardNull(iframeEl);
                guardNull(iframeEl.contentWindow);
                postMessage(iframeEl.contentWindow, { method: 'seekTo', value: positionMs });
                postMessage(iframeEl.contentWindow, { method: 'pause' });
            }),
            appRealtime.on('SET_VOLUME', ({ volume }) => {
                playerStore.volume = volume;
                if (!ready) {
                    return;
                }
                guardNull(iframeEl);
                guardNull(iframeEl.contentWindow);
                postMessage(iframeEl.contentWindow, {
                    method: 'setVolume',
                    value: playerStore.volume * 100
                });
            }),
            appRealtime.on('SEEK', ({ positionMs }) => {
                playerStore.position = positionMs;
                if (!ready) {
                    return;
                }
                guardNull(iframeEl);
                guardNull(iframeEl.contentWindow);
                postMessage(iframeEl.contentWindow, {
                    method: 'seekTo',
                    value: positionMs
                });
            })
        );
    });
</script>

<div>
    <iframe
        title="soundcloud song"
        scrolling="no"
        frameborder="no"
        allow="autoplay; encrypted-media"
        src="https://w.soundcloud.com/player/?url={encodeURIComponent(
            track.url
        )}&color=%23ff5500&auto_play=false&show_artwork=true&show_playcount=false&single_active=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&liking=false&following=false&buying=false&sharing=false&download=false&visual=false"
        bind:this={iframeEl}
        {@attach () => {
            return on(window, 'message', (e) => {
                if (e.origin !== 'https://w.soundcloud.com') {
                    return;
                }

                const data = JSON.parse(e.data);
                switch (data.method) {
                    case 'ready':
                        ready = true;
                        playerStore.status = 'ready';
                        ['play', 'pause', 'finish', 'seek'].map((value) => {
                            guardNull(e.source);
                            postMessage(e.source, { method: 'addEventListener', value });
                        });

                        guardNull(e.source);
                        postMessage(e.source, { method: 'seekTo', value: playerStore.position });
                        postMessage(e.source, {
                            method: 'setVolume',
                            value: playerStore.volume * 100
                        });
                        if (playerStore.startedAtMs != null) {
                            playerStore.status = 'playing';
                            postMessage(e.source, { method: 'play' });
                        }
                        break;
                    case 'getPosition':
                        if (seekDelta != null) {
                            guardNull(appRealtime);
                            appRealtime.send('SEEK', { positionMs: data.value + seekDelta });
                            seekDelta = null;
                        }
                        break;
                }
            });
        }}
    ></iframe>
    <button
        type="button"
        onclick={() => {
            guardNull(appRealtime);
            appRealtime.send('PLAY');
        }}>PLAY</button
    >
    <button
        type="button"
        onclick={() => {
            guardNull(appRealtime);
            appRealtime.send('PAUSE');
        }}>PAUSE</button
    >
    <button
        type="button"
        onclick={() => {
            guardNull(appRealtime);
            appRealtime.send('SET_VOLUME', {
                volume: Math.max(0, playerStore.volume - 0.1)
            });
        }}
    >
        -0.1
    </button>
    <button
        type="button"
        onclick={() => {
            guardNull(appRealtime);
            appRealtime.send('SET_VOLUME', {
                volume: Math.min(1, playerStore.volume + 0.1)
            });
        }}
    >
        +0.1
    </button>
    <button
        type="button"
        onclick={() => {
            guardNull(iframeEl?.contentWindow);
            seekDelta = -5000;
            postMessage(iframeEl.contentWindow, { method: 'getPosition' });
        }}
    >
        -5s
    </button>
    <button
        type="button"
        onclick={() => {
            guardNull(iframeEl?.contentWindow);
            seekDelta = 5000;
            postMessage(iframeEl.contentWindow, { method: 'getPosition' });
        }}
    >
        +5s
    </button>
</div>
