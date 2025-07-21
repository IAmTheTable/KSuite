import { error, isRedirect, redirect } from '@sveltejs/kit';
import { exchangeCode, getUserInfo } from '$lib/discord/util';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals, cookies }) {
    const code = url.searchParams.get('code');
    if (!code) {
        throw error(400, 'Missing authorization code');
    }

    try {
        // check if we have a session already
        const sessionCookie = cookies.get('session');
        if (sessionCookie) {
            // If we already have a session, redirect to the appropriate dashboard
            const session = await locals.sessionManager.validateSession(sessionCookie);
            if (session) {
                const user = await locals.users.getById(session.userId);
                if (user) {
                    const dashboardPath = user.permissions & 2 ? '/Dashboard/Staff' : '/Dashboard/User';
                    throw redirect(302, dashboardPath);
                }
            }
            else {
                // If session is invalid, clear the cookie
                cookies.delete('session', { path: '/' });
            }
        }

        // Exchange code for tokens
        const tokens = await exchangeCode(code);
        
        // Get user info from Discord
        const userInfo = await getUserInfo(tokens.access_token);

        // Redirect to appropriate dashboard based on permissions
        const user = await locals.users.getById(userInfo.id);

        if (!user) {
            // we create a new user session
            // Create a new user with default permissions
            await locals.users.upsert({
                id: userInfo.id,
                permissions: 1, // Default user permissions
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token
            });

            let newUser = await locals.users.getById(userInfo.id);

            if (!newUser) {
                throw error(500, 'Failed to create user');
            }
            
            // Create session
            const { session, cookieValue } = await locals.sessionManager.createSession(
                userInfo.id,
                tokens.access_token
            );
            // Set session cookie
            cookies.set('session', cookieValue, locals.sessionManager.getSessionCookieOptions());
            console.log("Created new user session for " + userInfo.username);

            const dashboardPath = newUser.permissions & 2 ? '/Dashboard/Staff' : '/Dashboard/User';
            throw redirect(302, dashboardPath);
        }

        // Create session
        const { session, cookieValue } = await locals.sessionManager.createSession(
            userInfo.id,
            tokens.access_token
        );

        // Set session cookie
        cookies.set('session', cookieValue, locals.sessionManager.getSessionCookieOptions());

        const dashboardPath = user.permissions & 2 ? '/Dashboard/Staff' : '/Dashboard/User';
        throw redirect(302, dashboardPath);
    } catch (err) {
        if(isRedirect(err)) {
            throw err; // Pass through the redirect as is
        }
        console.error('Error during OAuth flow:', err);
        throw error(500, 'Authentication error occurred');
    }
}
