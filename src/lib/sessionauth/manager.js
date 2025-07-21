import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { validateDiscordToken } from '../discord/util.js';
import { Sessions } from '../database/tables/sessions.js';
import { Users } from '../database/tables/users.js';
/**
 * @typedef {import('../database/tables/sessions.js').Session} Session
 * 
 * @typedef {Object} CookieOptions
 * @property {string} path - Cookie path
 * @property {boolean} httpOnly - Whether the cookie is HTTP only
 * @property {boolean} secure - Whether the cookie requires HTTPS
 * @property {'strict'|'lax'|'none'} sameSite - SameSite cookie policy
 * @property {number} maxAge - Cookie max age in seconds
 */

export class SessionManager {
    /** @type {Sessions | undefined} */
    #sessions = null;
    /** @type {Users | undefined} */
    #users = null;
    /** @type {boolean} */
    #initialized = false;

    /**
     * Create a new SessionManager instance
     * @param {import('../database/tables/sessions.js').Sessions} sessions - Sessions table manager
     * @param {import('../database/tables/users.js').Users} users - Users table
     */
    constructor(sessions, users) {
        if (!sessions || !users) {
            throw new Error('Sessions and Users managers are required');
        }
        this.#sessions = sessions;
        this.#users = users;
        this.#initialized = true;
    }

    /**
     * Generate a secure random session token
     * @returns {string}
     */
    #generateToken() {
        const buffer = new Uint8Array(32);
        crypto.getRandomValues(buffer);
        return Array.from(buffer)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate a secure random session ID
     * @returns {string}
     */
    #generateId() {
        const buffer = new Uint8Array(32);
        crypto.getRandomValues(buffer);
        return Array.from(buffer)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Create cookie options
     * @param {number} maxAge - Cookie max age in seconds
     * @returns {CookieOptions}
     */
    #getCookieOptions(maxAge) {
        return {
            path: '/',
            httpOnly: true,
            secure: !dev,
            sameSite: 'lax',
            maxAge
        };
    }

    /**
     * Create a new session for a user
     * @param {string} userId - User ID
     * @param {string} discordToken - Discord access token to validate
     * @returns {Promise<{ session: Session, cookieValue: string }>}
     */
    async createSession(userId, discordToken) {
        if (!this.#initialized) {
            throw error(500, 'SessionManager is not initialized');
        }

        // Validate the discord token first
        const isValid = await validateDiscordToken(discordToken);
        if (!isValid) {
            throw error(401, 'Invalid Discord token');
        }

        // Check if user exists
        const user = await this.#users.getById(userId);
        if (!user) {
            throw error(504, 'Invalid user.');
        }

        // Create session data
        const session = {
            id: this.#generateId(),
            userId,
            token: this.#generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 1 week
        };

        // Store in database
        await this.#sessions.create(session);

        // Clean up expired sessions
        await this.#sessions.deleteExpired();

        // Create cookie value
        const cookieValue = JSON.stringify({
            id: session.id,
            token: session.token
        });

        return { session, cookieValue };
    }

    /**
     * Validate a session from cookie data
     * @param {string} cookieValue - Cookie value to validate
     * @param {import('@sveltejs/kit').RequestEvent} event - SvelteKit request event
     * @returns {Promise<Session>}
     */
    async validateSession(cookieValue, event) {
        if (!this.#initialized) {
            throw error(500, 'SessionManager is not initialized');
        }

        try {
            const { id, token } = JSON.parse(cookieValue);

            // Get session from database
            const session = await this.#sessions.getByIdAndToken(id, token);
            if (!session) {
                throw error(401, 'Invalid session');
            }

            // Check if session is expired
            if (session.expiresAt < Date.now()) {
                await this.#sessions.delete(id);
                throw error(401, 'Session expired');
            }

            return session;
        } catch(err) {
            // clear session cookie if parsing fails
            event.cookies.delete('session', { path: '/' });
            throw error(501, 'Session error: ' + err.message);
        }
    }

    /**
     * Destroy a session
     * @param {string} cookieValue - Cookie value containing session info
     * @returns {Promise<void>}
     */
    async destroySession(cookieValue) {
        if (!this.#initialized) {
            throw error(500, 'SessionManager is not initialized');
        }

        try {
            const { id } = JSON.parse(cookieValue);
            await this.#sessions.delete(id);
        } catch {
            // Ignore errors when destroying session
        }
    }

    /**
     * Get cookie options for session
     * @returns {CookieOptions}
     */
    getSessionCookieOptions() {
        return this.#getCookieOptions(7 * 24 * 60 * 60); // 1 week
    }

    /**
     * Update session token
     * @param {string} sessionId - Session ID to update
     * @param {string} newToken - New token to set
     * @returns {Promise<void>}
     */
    async updateSessionToken(sessionId, newToken) {
        if (!this.#initialized) {
            throw error(500, 'SessionManager is not initialized');
        }

        // Update session token in database
        await this.#sessions.updateToken(sessionId, newToken);
        console.log(`Session ${sessionId} token updated`);
    }


    /**
     * Log out user from all sessions
     * @param {string} userId - User ID to log out
     * @returns {Promise<void>}
     */
    async logOutAllSessions(userId) {
        if (!this.#initialized) {
            throw error(500, 'SessionManager is not initialized');
        }

        await this.#sessions.deleteAllForUser(userId);
    }
}
