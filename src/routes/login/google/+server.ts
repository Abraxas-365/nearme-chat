import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { googleOAuthClient } from '$lib/server/lucia';

import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await googleOAuthClient.createAuthorizationURL(state, codeVerifier, {
		scopes: ['profile', 'email']
	});

	event.cookies.set('google_oauth_state', state, {
		path: '/',
		secure: import.meta.env.ENV,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	event.cookies.set('code_verifier', codeVerifier, {
		path: '/',
		secure: import.meta.env.ENV,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	return redirect(302, url.toString());
}
