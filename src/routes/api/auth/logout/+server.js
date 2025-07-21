import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies, locals }) {
    try {
        // If we have a session, delete it from the database
        const sessionId = cookies.get('session');
        if (sessionId && locals.sessions) {
            // Delete the session from the database
            await locals.sessions.delete(sessionId);
        }

        // Clear the session cookie
        cookies.delete('session', { 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        // Redirect to home page
        throw redirect(302, '/');
    } catch (err) {
        // If the error is a redirect, pass it through
        if (err instanceof Response) throw err;
        
        console.error('Logout error:', err);
        // Still redirect to home page even if there's an error
        throw redirect(302, '/');
    }
}