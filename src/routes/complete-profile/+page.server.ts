import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { pool, lucia } from '$lib/server/lucia';
import { userIdStore } from '$lib/stores/userStore';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const nickname = formData.get('nickname') as string;
		const userId = formData.get('userId') as string;
		const email = formData.get('email') as string;
		const googleId = formData.get('googleId') as string;
		const profileImage = formData.get('profileImage') as string;

		if (!nickname || !userId || !email || !googleId || !profileImage) {
			return fail(400, { message: 'All fields are required' });
		}

		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			await client.query(
				'INSERT INTO auth_user (id, email, nickname, google_id, profile_image) VALUES ($1, $2, $3, $4, $5)',
				[userId, email, nickname, googleId, profileImage]
			);

			await client.query('COMMIT');

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});

			userIdStore.set(userId);

			// Return success instead of redirecting
			return { success: true };
		} catch (error) {
			await client.query('ROLLBACK');
			console.error(error);
			return fail(500, { message: 'Failed to create user' });
		} finally {
			client.release();
		}
	}
};
