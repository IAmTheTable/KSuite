import { error, redirect } from '@sveltejs/kit';
import { Permissions } from '../database/tables/users.js';

/**
 * @typedef {Object} Session
 * @property {string} id - User ID
 * @property {string} sessionToken - Session authentication token
 * @property {number} permissions - User's permission flags
 * @property {number} expiresAt - Session expiration timestamp
 */

export class AuthManager {
    /** @type {import('../database/tables/users.js').Users} */
    #users;
    
    /** @type {string} */
    #secretKey;

    /**
     * Create a new AuthManager instance
     * @param {import('../database/tables/users.js').Users} users - Users table manager
     * @param {Object} config - Auth configuration
     * @param {string} config.secretKey - Secret key for session tokens
     */
    constructor(users, config) {
        this.#users = users;
        this.#secretKey = config.secretKey;
    }

    /**
     * Get user info from Discord API
     * @param {string} accessToken 
     * @returns {Promise<{ id: string, username: string }>}
     */
    async #getUserInfo(accessToken) {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw error(401, 'Invalid access token');
        }

        return response.json();
    }

    /**
     * Exchange OAuth code for tokens
     * @param {string} code 
     * @returns {Promise<{ access_token: string, refresh_token: string }>}
     */
    async #exchangeCode(code) {
        const params = new URLSearchParams({
            client_id: this.#clientId,
            client_secret: this.#clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.#redirectUri
        });

        const response = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw error(400, 'Failed to exchange code for tokens');
        }

        return response.json();
    }

    /**
     * Refresh an access token
     * @param {string} refreshToken 
     * @returns {Promise<{ access_token: string, refresh_token: string }>}
     */
    async #refreshToken(refreshToken) {
        const params = new URLSearchParams({
            client_id: this.#clientId,
            client_secret: this.#clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });

        const response = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw error(400, 'Failed to refresh token');
        }

        return response.json();
    }

    /**
     * Handle OAuth callback
     * @param {string} code - OAuth authorization code
     * @returns {Promise<Session>}
     */
    async handleCallback(code) {
        // Exchange code for tokens
        const tokens = await this.#exchangeCode(code);
        
        // Get user info from Discord
        const userInfo = await this.#getUserInfo(tokens.access_token);
        
        // Get or create user in database
        const user = await this.#users.getById(userInfo.id) ?? {
            id: userInfo.id,
            permissions: Permissions.USER,  // New users get basic permissions
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
        };

        // Update tokens in database
        await this.#users.upsert(user);

        // Return session data
        return {
            id: user.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            permissions: user.permissions
        };
    }

    /**
     * Verify and refresh a session if needed
     * @param {Session} session
     * @returns {Promise<Session>}
     */
    async verifySession(session) {
        try {
            // Try to get user info with current token
            await this.#getUserInfo(session.accessToken);
            return session;
        } catch (err) {
            try {
                // Token expired, try to refresh
                const tokens = await this.#refreshToken(session.refreshToken);
                
                // Update tokens in database
                await this.#users.updateTokens(session.id, tokens.access_token, tokens.refresh_token);
                
                // Return updated session
                return {
                    ...session,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token
                };
            } catch (refreshErr) {
                // Refresh failed, session is invalid
                throw redirect(302, '/api/auth/login');
            }
        }
    }

    /**
     * Get OAuth login URL
     * @returns {string}
     */
    getLoginUrl() {
        const params = new URLSearchParams({
            client_id: this.#clientId,
            redirect_uri: this.#redirectUri,
            response_type: 'code',
            scope: 'identify'
        });

        return `https://discord.com/api/oauth2/authorize?${params}`;
    }

    /**
     * Check if user has required permissions
     * @param {Session} session 
     * @param {number} requiredPermissions 
     * @returns {boolean}
     */
    hasPermission(session, requiredPermissions) {
        return (session.permissions & requiredPermissions) === requiredPermissions;
    }
}
