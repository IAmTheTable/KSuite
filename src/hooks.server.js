import { error, isActionFailure, isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { DatabaseManager } from '$lib/database/manager';
import { SessionManager } from '$lib/sessionauth/manager';
import { isJSDocPropertyLikeTag } from 'typescript';


/** @type {DatabaseManager} */
let db;

// Initialize the database connection
const initDb = async () => {
    if (!db) {
        db = new DatabaseManager({
            host: '192.168.137.128',
            user: 'u11_oEEHiOUCNZ',
            password: '3d0+yo3UDwfyoCWyi+433.VP',
            database: 's11_KSuite'
        });
        await db.init();
    }
    return db;
};
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    //always lowercase the path
    event.url.pathname = event.url.pathname.toLowerCase();
    console.log('Handling request:', event.request.method, event.url.pathname);
    // Initialize database if not already initialized
    const database = await initDb();

    // Intialize the session manager
    const sessionMan = new SessionManager(database.sessions, database.users);
    // Attach database to event.locals so it's available in all server-side code
    event.locals.db = database;
    event.locals.users = database.users;
    event.locals.sessions = database.sessions;
    event.locals.sessionManager = sessionMan;

    // Skip auth for public routes
    if (event.url.pathname.startsWith('/api/auth')) {
        return resolve(event);
    }
    // Check for session cookie
    const session = event.cookies.get('session');
    if (!session && event.url.pathname !== '/') {
        throw redirect(302, '/');
    }

    if(!session && event.url.pathname === '/') {
        // If no session and on the home page, just resolve
        return resolve(event);
    }

    // If session exists, validate it
    if (session) {
        let isValid = await sessionMan.validateSession(session, event);
        if (!isValid) {
            // Invalid session, clear cookie and redirect to login
            event.cookies.delete('session', { path: '/' });
            throw redirect(302, '/');
        }
        // Add session to locals for route handlers
        event.locals.session = isValid;

        // redirect to dashboard if already logged in
        if (event.url.pathname === '/') {
            const user = await event.locals.users.getById(isValid.userId);
            if (user) {
                const dashboardPath = user.permissions & 2 ? '/Dashboard/Staff' : '/Dashboard/User';
                throw redirect(302, dashboardPath);
            }
        }
    }

    try {
        const verifiedSession = await sessionMan.validateSession(session);
        
        // Update session cookie if tokens were refreshed
        if (verifiedSession.token !== JSON.parse(session).token) {
            console.log('Session token refreshed, updating cookie');
            event.cookies.set('session', JSON.stringify(verifiedSession), {
                path: '/',
                httpOnly: true,
                secure: !dev,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
        }

        // Add session to locals for route handlers
        event.locals.session = verifiedSession;
        event.locals.user = await event.locals.users.getById(verifiedSession.userId);
        // since we have a valid session, lets ensure the request is valid as well

        throw await resolve(event);
    } 
    catch (req)
    {
        if(isRedirect(req)) 
            throw req;
        if(isHttpError(req)) {
            // If it's an HTTP error, we can throw it directly
            throw error(req.status, req.message || 'An error occurred while processing your request');
        }
        if(isActionFailure(req)) {
            // If it's an action failure, we can return it directly
            return req;
        }
        if(!req)
            throw new Error('Unknown error occurred');

        if(req.status !== 200)
        {
            const user = await event.locals.users.getById(event.locals.user?.id);
            if (user) {
                const dashboardPath = user.permissions & 2 ? '/dashboard/staff' : '/dashboard/user';
                throw redirect(302, dashboardPath);
            }
        }
        else {
            return resolve(event);
        }

        // If an error occurs and it's not a redirect, return a generic error response
        throw error(req.status, req.message || 'An error occurred while processing your request');
    }
}


// Cleanup on server shutdown
process.on('SIGTERM', async () => {
    await db.close();
});