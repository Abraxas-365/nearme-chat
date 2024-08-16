import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';
import { Google } from 'arctic';

export const pool = new pg.Pool({
	host: import.meta.env.VITE_DB_HOST,
	port: 5432, // the port you've mapped in your docker-compose
	user: import.meta.env.VITE_USER,
	password: import.meta.env.VITE_PASS,
	database: import.meta.env.VITE_DB_NAME
});

const adapter = new NodePostgresAdapter(pool, {
	user: 'auth_user',
	session: 'user_session'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.VITE_ENV === 'production'
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
	import.meta.env.VITE_CLIENT,
	import.meta.env.VITE_SECRET,
	`${import.meta.env.VITE_FRONT}/auth/google/callback`
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
