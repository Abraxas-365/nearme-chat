import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';
import { Google } from 'arctic';

export const pool = new pg.Pool({
	host: 'localhost', // or the IP where your Docker is running
	port: 5432, // the port you've mapped in your docker-compose
	user: 'myuser',
	password: 'mypassword',
	database: 'mydatabase'
});

const adapter = new NodePostgresAdapter(pool, {
	user: 'auth_user',
	session: 'user_session'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			nickname: attributes.nickname,
			googleId: attributes.google_id,
			profileImage: attributes.profile_image
		};
	}
});

export const googleOAuthClient = new Google(
	'22795433123-3tqiop2jfekacg2ig7toen3hpbimjlv5.apps.googleusercontent.com',
	'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',
	'http://localhost:5173/auth/google/callback'
);

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			nickname: string;
			google_id: string;
			profile_image: string;
		};
	}
}
