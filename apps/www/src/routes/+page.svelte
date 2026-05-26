<script lang="ts">
    import { createRoom } from "./__page__/page.remote";
</script>

<main class="p-4">
    <form {...createRoom}>
        <button type="submit">Create room</button>
    </form>
</main>
