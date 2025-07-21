import { v4 as uuid } from 'uuid';

export class Tickets {
    constructor(pool) {
        this.pool = pool;
    }

    async create(ticket) {
        const id = uuid();
        await this.pool.query(
            'INSERT INTO tickets (id, userId, subject, description, category, transcript) VALUES (?, ?, ?, ?, ?, ?)',
            [id, ticket.userId, ticket.subject, ticket.description, ticket.category, JSON.stringify(ticket.transcript)]
        );
        return id;
    }

    async getById(id) {
        const [rows] = await this.pool.query(
            'SELECT * FROM tickets WHERE id = ?',
            [id]
        );
        if (rows.length === 0) return null;
        
        const ticket = rows[0];
        ticket.transcript = JSON.parse(ticket.transcript);
        return ticket;
    }

    async init() {
        // Create the tickets table if it doesn't exist
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id VARCHAR(36) PRIMARY KEY,
                userId VARCHAR(36) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                transcript JSON NOT NULL,
                status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    }

    async getByUserId(userId) {
        const [rows] = await this.pool.query(
            'SELECT * FROM tickets WHERE userId = ? ORDER BY updatedAt DESC',
            [userId]
        );
        return rows.map(ticket => {
            ticket.transcript = JSON.parse(ticket.transcript);
            return ticket;
        });
    }

    async updateStatus(id, status) {
        await this.pool.query(
            'UPDATE tickets SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    async addToTranscript(id, message) {
        const ticket = await this.getById(id);
        if (!ticket) throw new Error('Ticket not found');

        const transcript = ticket.transcript;
        transcript.push(message);

        await this.pool.query(
            'UPDATE tickets SET transcript = ? WHERE id = ?',
            [JSON.stringify(transcript), id]
        );
    }

    /**
     * Get ticket statistics
     * @returns {Promise<{ total: number, open: number, closed: number }>}
     */
    async getStats() {
        const [rows] = await this.pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM tickets
        `);
        return rows[0];
    }

    /**
     * Get recent tickets
     * @param {number} limit - Number of tickets to return
     * @returns {Promise<Array>}
     */
    async getRecent(limit = 5) {
        const [rows] = await this.pool.query(
            'SELECT * FROM tickets ORDER BY updatedAt DESC LIMIT ?',
            [limit]
        );
        return rows.map(ticket => ({
            ...ticket,
            transcript: JSON.parse(ticket.transcript)
        }));
    }
}
