/** @typedef {'pending' | 'in-progress' | 'resolved'} TicketStatus */

/** @type {Record<string, TicketStatus>} */
export const TicketStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved'
};

Object.freeze(TicketStatus);

// Type definition for a ticket
/** @typedef {{
 *   id: number,
 *   subject: string,
 *   description: string,
 *   status: TicketStatus,
 *   createdAt: string
 * }} Ticket */

/** @type {Ticket[]} */
export const tickets = [];
