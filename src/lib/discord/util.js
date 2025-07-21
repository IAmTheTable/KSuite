const API_ENDPOINT = 'https://discord.com/api/v10';

/**
 * Validate a Discord access token
 * @param {string} token - Discord access token to validate
 * @returns {Promise<boolean>}
 */
export async function validateDiscordToken(token) {
    try {
        const response = await fetch(`${API_ENDPOINT}/users/@me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * @typedef {Object} DiscordTokenResponse
 * @property {string} access_token - The access token for making API requests
 * @property {string} token_type - The type of token (usually "Bearer")
 * @property {number} expires_in - Number of seconds until the token expires
 * @property {string} refresh_token - Token used to refresh the access token
 * @property {string} scope - The scopes that were approved
 */

/**
 * @typedef {Object} DiscordUser
 * @property {string} id - The user's unique Discord ID
 * @property {string} username - The user's username
 * @property {string} discriminator - The user's 4-digit Discord tag
 * @property {string} avatar - The user's avatar hash
 * @property {string} [email] - The user's email (if 'email' scope is approved)
 * @property {boolean} verified - Whether the email has been verified
 * @property {string} [banner] - The user's banner hash
 * @property {string} [accent_color] - The user's banner color
 */

// These should be in your environment variables in production
const config = {
    CLIENT_ID: process.env.DISCORD_CLIENT_ID || '1040433595904446495',
    CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || 't-cI1NZ_Bb2HXDETCJb81sRhkjAS17Ny',
    REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://tickets.krnlchan.lol:8080/api/auth'
};

export { config };

/**
 * Exchange the authorization code for an access token
 * @param {string} code - The authorization code from Discord OAuth
 * @returns {Promise<DiscordTokenResponse>} The OAuth tokens and user information
 */
export async function exchangeCode(code) {
    const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.REDIRECT_URI
    });

    try {
        const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            if(!response.status)
                throw new Error('Unknown error occurred while exchanging code');
            else
                throw new Error(`Discord OAuth error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error exchanging code:', error);
        throw error;
    }
}

/**
 * Refresh the access token using the refresh token
 * @param {string} rToke - The refresh token
 * @returns {Promise<DiscordTokenResponse>} The new access token and user information
 * */

export async function refreshToken(rToke) {
    const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: rToke
    });

    return fetch(`${API_ENDPOINT}/oauth2/token`, {
        method: 'POST',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(response => {
        if (!response.ok) {
            if(!response.status)
                throw new Error('Unknown error occurred while refreshing token');
            else
                throw new Error(`Discord OAuth error: ${response.status}`);
        }
        return response.json();
    });
}

/**
 * Get the Discord OAuth URL
 * @returns {string} The OAuth URL
 */
export function getOAuthURL() {
    const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        redirect_uri: config.REDIRECT_URI,
        response_type: 'code',
        scope: 'identify email guilds'
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Get user information using the access token
 * @param {string} accessToken - The access token from OAuth
 * @returns {Promise<DiscordUser>} The user information
 */
export async function getUserInfo(accessToken) {
    try {
        const response = await fetch(`${API_ENDPOINT}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if(!response.status)
                throw new Error('Unknown error occurred while fetching user info');
            else
                throw new Error(`Failed to get user info: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
}
