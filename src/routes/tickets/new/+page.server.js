import { error, isRedirect, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    if (!locals.session) {
        throw error(401, 'Unauthorized');
    }

    return {
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
        const subject = formData.get('subject')?.toString();
        const description = formData.get('description')?.toString();
        const category = formData.get('category')?.toString();

        if (!subject || !description || !category) {
            return {
                error: 'All fields are required'
            };
        }

        try {
            const ticketId = await locals.db.tickets.create({
                userId: locals.session.userId,
                subject,
                description,
                category,
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transcript: [] // Initialize empty transcript array
            });

            // Redirect to the newly created ticket page
            if (!ticketId) {
                throw error(500, 'Failed to create ticket');
            }
            throw redirect(303, `/tickets/${ticketId}`);
        } catch (err) {
            if(isRedirect(err))
                throw err;
            console.error('Error creating ticket:', err);
            return {
                error: 'Failed to create ticket. Please try again.'
            };
        }
    }
};
