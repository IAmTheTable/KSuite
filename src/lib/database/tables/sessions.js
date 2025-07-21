/**
 * @typedef {Object} Session
 * @property {string} id - Unique session ID
 * @property {string} userId - User's ID
 * @property {string} token - Session token for validation
 * @property {number} createdAt - Session creation timestamp
 * @property {number} expiresAt - Session expiration timestamp
 */

/** @typedef {import('mysql2/promise').Connection} Connection */


export class Sessions {
    /** @type {Connection} */
    #db;
    /** @type {string} */
    #tableName;

    /**
     * Create a new Sessions table manager
     * @param {Connection} connection - The database connection
     */
    constructor(connection) {
        this.#db = connection;
        this.#tableName = 'sessions';
    }

    /**
     * Initialize the sessions table
     * @returns {Promise<void>}
     */
    async init() {
        const query = `
            CREATE TABLE IF NOT EXISTS ${this.#tableName} (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                token VARCHAR(64) NOT NULL,
                created_at BIGINT NOT NULL,
                expires_at BIGINT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        await this.#db.execute(query);
    }

    /**
     * Create a new session
     * @param {Session} session - Session data
     * @returns {Promise<void>}
     */
    async create(session) {
        const query = `
            INSERT INTO ${this.#tableName} (id, user_id, token, created_at, expires_at)
            VALUES (:id, :userId, :token, :createdAt, :expiresAt)
        `;
        await this.#db.execute(query, {
            id: session.id,
            userId: session.userId,
            token: session.token,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
        });
    }

    /**
     * Get a session by its ID and token
     * @param {string} id - Session ID
     * @param {string} token - Session token
     * @returns {Promise<Session|null>}
     */
    async getByIdAndToken(id, token) {
        const query = `
            SELECT * FROM ${this.#tableName}
            WHERE id = :id AND token = :token
        `;
        const [rows] = await this.#db.execute(query, { id, token });
        const row = rows[0];

        if (!row) return null;

        return {
            id: row.id,
            userId: row.user_id,
            token: row.token,
            createdAt: row.created_at,
            expiresAt: row.expires_at
        };
    }

    /**
     * Update a session's token
     * @param {string} id - Session ID
     * @param {string} newToken - New session token
     * @returns {Promise<void>}
     */
    async updateToken(id, newToken) {
        const query = `
            UPDATE ${this.#tableName}
            SET token = :newToken
            WHERE id = :id
        `;
        await this.#db.execute(query, { id, newToken });
    }

    /**
     * Delete expired sessions
     * @returns {Promise<void>}
     */
    async deleteExpired() {
        const query = `
            DELETE FROM ${this.#tableName}
            WHERE expires_at < :now
        `;
        await this.#db.execute(query, { now: Date.now() });
    }

    /**
     * Delete a specific session
     * @param {string} id - Session ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const query = `
            DELETE FROM ${this.#tableName}
            WHERE id = :id
        `;
        await this.#db.execute(query, { id });
    }

    /**
     * Delete all sessions for a user
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteAllForUser(userId) {
        const query = `
            DELETE FROM ${this.#tableName}
            WHERE user_id = :userId
        `;
        await this.#db.execute(query, { userId });
    }
}
