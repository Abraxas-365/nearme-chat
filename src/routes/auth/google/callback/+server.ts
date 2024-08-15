import { OAuth2RequestError } from 'arctic';
import { generateId } from 'lucia';
import { pool, googleOAuthClient, lucia } from '$lib/server/lucia';

import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('code_verifier') ?? null;

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await googleOAuthClient.validateAuthorizationCode(code, codeVerifier);
		const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUser: GoogleUser = await googleUserResponse.json();

		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			const result = await client.query('SELECT * FROM auth_user WHERE google_id = $1', [
				googleUser.id
			]);
			const existingUser = result.rows[0];

			if (existingUser) {
				// Update the user's information in case it has changed
				await client.query('UPDATE auth_user SET email = $1, profile_image = $2 WHERE id = $3', [
					googleUser.email,
					googleUser.picture,
					existingUser.id
				]);

				const session = await lucia.createSession(existingUser.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);

				await client.query('COMMIT');

				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});

				return new Response(null, {
					status: 302,
					headers: {
						Location: '/'
					}
				});
			} else {
				// For new users, redirect to nickname selection page with user info as query params
				const userId = generateId(15);
				await client.query('COMMIT');

				return new Response(null, {
					status: 302,
					headers: {
						Location: `/complete-profile?userId=${userId}&email=${encodeURIComponent(googleUser.email)}&googleId=${googleUser.id}&profileImage=${encodeURIComponent(googleUser.picture)}`
					}
				});
			}
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		console.error(e);
		return new Response(null, {
			status: 500
		});
	}
}

interface GoogleUser {
	id: string;
	email: string;
	name: string;
	picture: string;
}
