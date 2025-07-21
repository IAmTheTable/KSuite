import { error, redirect } from "@sveltejs/kit";
import { getUserInfo } from "$lib/discord/util"; // Assuming you have a function to fetch Discord user info
/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    if (!locals.session) {
        throw redirect(302, '/');
    }

    // Check if user has staff permissions (bit 1)
    if (!(locals.user?.permissions & 2)) {
        throw error(403, 'Access denied');
    }

    // Get all users and their permissions
    const users = await locals.users.getAll();
    const ticketStats = await locals.db.tickets.getStats();
    const recentTickets = await locals.db.tickets.getRecent(5);

    // Fetch Discord user info for all users
    const userInfoPromises = users.map(async (u) => {
        try {
            // Try with current token
            const discordInfo = await getUserInfo(u.accessToken);
            return {
                ...discordInfo,
                permissions: u.permissions,
                isStaff: !!(u.permissions & 2),
                isAdmin: !!(u.permissions & 4)
            };
        } catch (error) {
            console.error('Failed to get Discord info for user:', u.id, error);
            // Return basic info if we can't get Discord data
            return {
                id: u.id,
                username: `User ${u.username}`,
                discriminator: '0000',
                avatar: null,
                permissions: u.permissions,
                isStaff: !!(u.permissions & 2),
                isAdmin: !!(u.permissions & 4)
            };
        }
    });

    const usersList = await Promise.all(userInfoPromises);

    return {
        user: locals.user,
        users: usersList.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            permissions: u.permissions,
            isStaff: !!(u.permissions & 2),
            isAdmin: !!(u.permissions & 4)
        })),
        stats: {
            totalUsers: users.length,
            totalTickets: ticketStats.total,
            openTickets: ticketStats.open,
            closedTickets: ticketStats.closed
        },
        recentTickets
    };
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Update user permissions
    updatePermissions: async ({ request, locals }) => {
        if (!locals.session) {
            throw error(401, 'Unauthorized');
        }

        // Check if user has admin permissions (bit 2)
        if (!(locals.user?.permissions & 4)) {
            throw error(403, 'Admin access required');
        }

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();
        const action = formData.get('action')?.toString();

        if (!userId || !action) {
            throw error(400, 'Missing required fields');
        }

        try {
            const targetUser = await locals.users.getById(userId);
            if (!targetUser) {
                throw error(404, 'User not found');
            }

            let newPermissions = targetUser.permissions;

            switch (action) {
                case 'promote_staff':
                    newPermissions |= 2; // Set staff bit
                    break;
                case 'demote_staff':
                    newPermissions &= ~2; // Clear staff bit
                    break;
                case 'promote_admin':
                    newPermissions |= 4; // Set admin bit
                    break;
                case 'demote_admin':
                    newPermissions &= ~4; // Clear admin bit
                    break;
                default:
                    throw error(400, 'Invalid action');
            }

            // Don't allow removing your own admin permissions
            if (userId === locals.session.userId && action === 'demote_admin') {
                throw error(400, 'Cannot remove your own admin permissions');
            }

            await locals.users.updatePermissions(userId, newPermissions);

            return {
                success: true,
                message: 'Permissions updated successfully'
            };
        } catch (err) {
            console.error('Error updating permissions:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Failed to update permissions'
            };
        }
    }
};