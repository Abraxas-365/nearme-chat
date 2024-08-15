<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let nickname = '';
	let error = '';

	$: userId = $page.url.searchParams.get('userId') || '';
	$: email = $page.url.searchParams.get('email') || '';
	$: googleId = $page.url.searchParams.get('googleId') || '';
	$: profileImage = $page.url.searchParams.get('profileImage') || '';
</script>

<div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
	<h1 class="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
	<p class="text-gray-600 mb-6">Please choose a nickname to complete your registration.</p>

	<form method="POST" use:enhance class="space-y-4">
		<input type="hidden" name="userId" value={userId} />
		<input type="hidden" name="email" value={email} />
		<input type="hidden" name="googleId" value={googleId} />
		<input type="hidden" name="profileImage" value={profileImage} />

		<div>
			<label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
			<input
				type="text"
				id="nickname"
				name="nickname"
				bind:value={nickname}
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		{#if error}
			<p class="text-red-600 text-sm">{error}</p>
		{/if}

		<button
			type="submit"
			class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
		>
			Complete Registration
		</button>
	</form>
</div>
