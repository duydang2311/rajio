<script>
	import { signUp } from './__page__/page.remote';
</script>

<main class="min-h-screen flex justify-center items-center p-8">
	<form {...signUp}>
		<input
			{...signUp.fields.displayName.as('text')}
			type="text"
			placeholder="Enter your username..."
			class="block focus:outline-none text-fg-hard tracking-tight"
		/>
		<button type="submit" class="block w-full mt-2 c-button c-button--primary">Join</button>
	</form>
</main>
