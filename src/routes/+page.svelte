<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Avatar } from '@skeletonlabs/skeleton';

	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371; // Radius of the earth in km
		const dLat = deg2rad(lat2 - lat1);
		const dLon = deg2rad(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const d = R * c; // Distance in km
		return Math.round(d * 10) / 10; // Round to one decimal place
	}

	function deg2rad(deg: number): number {
		return deg * (Math.PI / 180);
	}

	function formatRelativeTime(dateString: string): string {
		const now = new Date();
		const past = new Date(dateString);
		const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

		if (diffInSeconds < 60) {
			return 'just now';
		} else if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		} else if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else {
			const days = Math.floor(diffInSeconds / 86400);
			return `${days} day${days > 1 ? 's' : ''} ago`;
		}
	}

	function formatMessageDetails(dateString: string, messageCoords: Coordinates): string {
		const date = new Date(dateString);
		const hour = date.getHours().toString().padStart(2, '0');
		const minute = date.getMinutes().toString().padStart(2, '0');
		const timeString = `${hour}:${minute}`;

		let distanceString = '';
		if (currentLocation) {
			const distance = calculateDistance(
				currentLocation.latitude,
				currentLocation.longitude,
				messageCoords.latitude,
				messageCoords.longitude
			);
			distanceString = `${distance} km away`;
		}

		return `${timeString} • ${distanceString}`;
	}

	// Import the data from the parent layout or page
	export let data;

	interface Coordinates {
		latitude: number;
		longitude: number;
	}

	interface User {
		id: string;
		nickname: string;
		profile_image: string;
	}

	interface MessageWithUserData {
		id: number;
		user_id: string;
		message: string;
		coordinates: Coordinates;
		created_at: string;
		user: User;
	}

	let elemChat: HTMLElement;
	let messageFeed: MessageWithUserData[] = [];
	let currentMessage = '';
	let currentUserId = ''; // This will be set in onMount
	let currentLocation: Coordinates | null = null;

	const API_BASE_URL = import.meta.env.VITE_SERVER;
	const sessionId = data.sessionId; // Use the session ID from the server

	let updateInterval: NodeJS.Timeout;

	function scrollChatBottom(behavior?: ScrollBehavior): void {
		elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
	}

	async function getCurrentLocation(): Promise<Coordinates> {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation is not supported by your browser'));
			} else {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						resolve({
							latitude: position.coords.latitude,
							longitude: position.coords.longitude
						});
					},
					(error) => {
						reject(error);
					}
				);
			}
		});
	}

	async function fetchMessages() {
		if (!currentLocation) {
			console.error('Location not available');
			return;
		}

		const response = await fetch(
			`${API_BASE_URL}/messages?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`,
			{
				headers: {
					Authorization: `${sessionId}`
				}
			}
		);

		if (response.ok) {
			messageFeed = await response.json();
			setTimeout(() => {
				scrollChatBottom('auto');
			}, 0);
		} else {
			console.error('Failed to fetch messages');
		}
	}

	async function addMessage() {
		if (!currentMessage.trim() || !currentLocation) return;

		const newMessage = {
			message: currentMessage,
			latitude: currentLocation.latitude,
			longitude: currentLocation.longitude
		};

		const response = await fetch(`${API_BASE_URL}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `${sessionId}`
			},
			body: JSON.stringify(newMessage)
		});

		if (response.ok) {
			const savedMessage: MessageWithUserData = await response.json();
			messageFeed = [...messageFeed, savedMessage];
			currentMessage = '';
			setTimeout(() => {
				scrollChatBottom('smooth');
			}, 0);
		} else {
			console.error('Failed to send message');
		}
	}

	function updateMessageTimes() {
		messageFeed = [...messageFeed]; // Trigger reactivity
	}

	onMount(async () => {
		try {
			currentLocation = await getCurrentLocation();
			fetchMessages();
			currentUserId = data.userId; // Set the current user ID from the server data

			// Set up interval to update relative times
			updateInterval = setInterval(updateMessageTimes, 60000); // Update every minute
		} catch (error) {
			console.error('Error getting location:', error);
		}
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
</script>

<div class="grid grid-rows-[1fr_auto] gap-1 h-screen">
	<div bind:this={elemChat} class="bg-surface-500/30 p-4 overflow-y-auto">
		<section class="w-full p-4 overflow-y-auto space-y-4">
			{#each messageFeed as bubble}
				{#if bubble.user_id === data.userId}
					<!-- Host Message Bubble -->
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<Avatar src={bubble.user.profile_image} width="w-12" />
						<div class="card p-4 variant-soft rounded-tl-none space-y-2">
							<header class="flex flex-col items-start">
								<div class="flex justify-between items-center w-full">
									<p class="font-bold">{bubble.user.nickname}</p>
									<small class="opacity-50">
										{formatMessageDetails(bubble.created_at, bubble.coordinates)}
									</small>
								</div>
							</header>
							<p>{bubble.message}</p>
						</div>
					</div>
				{:else}
					<!-- Guest Message Bubble -->
					<div class="grid grid-cols-[1fr_auto] gap-2">
						<div class="card p-4 rounded-tr-none space-y-2 variant-soft-primary">
							<header class="flex flex-col items-start">
								<div class="flex justify-between items-center w-full">
									<p class="font-bold">{bubble.user.nickname}</p>
									<small class="opacity-50">
										{formatMessageDetails(bubble.created_at, bubble.coordinates)}
									</small>
								</div>
							</header>
							<p>{bubble.message}</p>
						</div>
						<Avatar src={bubble.user.profile_image} width="w-12" />
					</div>
				{/if}
			{/each}
		</section>
	</div>

	<div class="bg-surface-500/30 p-4">
		<div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token">
			<button class="input-group-shim">+</button>
			<textarea
				bind:value={currentMessage}
				class="bg-transparent border-0 ring-0"
				name="prompt"
				id="prompt"
				placeholder="Write a message..."
				rows="1"
			/>
			<button class="variant-filled-primary" on:click={addMessage}>Send</button>
		</div>
	</div>
</div>
