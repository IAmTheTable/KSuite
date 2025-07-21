// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { DatabaseManager } from '$lib/database/manager';
import type { Users, User } from '$lib/database/tables/users';
import type { Sessions } from '$lib/database/tables/sessions';
import type { SessionManager, Session } from '$lib/sessionauth/manager';

declare global {
	namespace App {
		interface Locals {
            db: DatabaseManager;
            users: Users;
            sessions: Sessions;
            sessionManager: SessionManager;
            session?: Session;
            user?: User;
        }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
