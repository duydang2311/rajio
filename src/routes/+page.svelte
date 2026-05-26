<script lang="ts">
    import { getUser } from '../modules/user/data.remote';

    const user = $derived(await getUser());
</script>

<main class="p-4">
    <h1 class="text-fg-hard text-2xl">
        Hello {user.displayName}!
    </h1>
</main>
