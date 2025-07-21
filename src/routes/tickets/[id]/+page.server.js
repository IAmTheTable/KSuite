import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, locals }) => {
    if (!locals.session) {
        throw error(401, 'Unauthorized');
    }

    const ticket = await locals.db.tickets.getById(params.id);
    
    if (!ticket) {
        throw error(404, 'Ticket not found');
    }

    // Only allow access if user owns the ticket or is staff
    if (ticket.userId !== locals.session.userId && !(locals.user.permissions & 2)) {
        throw error(403, 'Access denied');
    }

    return {
        ticket,
        user: locals.user
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, locals, params }) => {
        if (!locals.session) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const action = formData.get('action')?.toString();
        const message = formData.get('message')?.toString();

        const ticket = await locals.db.tickets.getById(params.id);
        if (!ticket) {
            throw error(404, 'Ticket not found');
        }

        // Only allow access if user owns the ticket or is staff
        if (ticket.userId !== locals.session.userId && !(locals.user.permissions & 2)) {
            throw error(403, 'Access denied');
        }

        try {
            if (action === 'close' || action === 'reopen') {
                await locals.db.tickets.updateStatus(params.id, action === 'close' ? 'closed' : 'open');
            } else if (message) {
                // Add message to transcript
                const newMessage = {
                    userId: locals.session.userId,
                    userName: locals.user.name,
                    userAvatar: locals.user.avatar,
                    content: message,
                    isStaff: !!(locals.user.permissions & 2),
                    timestamp: new Date().toISOString()
                };

                await locals.db.tickets.addToTranscript(params.id, newMessage);
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating ticket:', err);
            return {
                error: 'Failed to update ticket. Please try again.'
            };
        }
    }
};
