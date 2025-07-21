import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    if (!locals.session) {
        throw error(401, 'Unauthorized');
    }

    const tickets = await locals.db.tickets.getByUserId(locals.session.userId);

    return {
        tickets,
        user: locals.user
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, locals }) => {
        if (!locals.session) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const action = formData.get('action');

        switch (action) {
            case 'close':
                const ticketId = formData.get('ticketId');
                await locals.db.tickets.updateStatus(ticketId, 'closed');
                return { success: true };
            
            default:
                throw error(400, 'Invalid action');
        }
    }
};