import { redirect } from '@sveltejs/kit';
import { SessionManager } from '$lib/sessionauth/manager';
import { validateDiscordToken, getUserInfo, exchangeCode, refreshToken } from '$lib/discord/util';
/** @type {import('./$types').PageServerLoad} */
export const load = async ({ cookies, locals }) => {
    const sessionId = cookies.get('session');
    
    if (!sessionId) {
        // respond with poopy
        throw new Response("Poopy", { status: 420 });
    }

    if (!locals.user) {
        throw new Response("Poopy", { status: 421 });
    }

    var dUser = locals.user;
    if(!dUser)
        throw new Response("Poopy", { status: 422 });

    // get discord token from user session

    const isValid = await validateDiscordToken(dUser.accessToken);
    if (!isValid) {
        // if token not valid, refresh it
        const newToken = await refreshToken(dUser.refreshToken);
        if (!newToken) {
            throw new Response("Poopy", { status: 423 });
        }
        // update the session with the new token
        locals.users.updateTokens(dUser.id, {
            accessToken: newToken.access_token,
            refreshToken: newToken.refresh_token
        });

        locals.user.accessToken = newToken.access_token;
        locals.user.refreshToken = newToken.refresh_token;

        // fetch user info with the new token
        const userInfo = await getUserInfo(locals.user.accessToken);
        if (!userInfo) {
            throw new Response("Poopy", { status: 424 });
        }
        console.log("User info fetched with new token:", userInfo);
    }

    const { username, avatar, id } = await getUserInfo(locals.user.accessToken);
    if (!username || !id) {
        throw new Response("Poopy", { status: 425 });
    }

    return {
        user: {
            name: username,
            avatar: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
            id
        }
    };
};