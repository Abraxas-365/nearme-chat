import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { lucia } from '$lib/server/lucia'; // Make sure to import lucia

export const load: PageServerLoad = async (event) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		throw redirect(302, '/login');
	}

	try {
		const { user } = await lucia.validateSession(sessionId);
		if (user) {
			return {
				username: user.nickname,
				userId: user.id,
				sessionId
			};
		}
	} catch (error) {
		event.cookies.set(lucia.sessionCookieName, '', {
			path: '/',
			expires: new Date(0)
		});
		throw redirect(302, '/login');
	}

	throw redirect(302, '/login');
};
