// Using only type imports from mysql2/promise

/** @typedef {import('mysql2/promise').Connection} Connection */

/**
 * @typedef {Object} User
 * @property {string} id - Discord user ID (ulong stored as string due to JS number limitations)
 * @property {number} permissions - Bitflag-based permissions
 * @property {string} accessToken - Discord OAuth access token
 * @property {string} refreshToken - Discord OAuth refresh token
 */

/**
 * Represents the permissions available to users
 * @enum {number}
 */
export const Permissions = {
    NONE: 0,
    USER: 1 << 0,         // 1
    MODERATOR: 1 << 1,    // 2
    ADMIN: 1 << 2,        // 4
    SUPER_ADMIN: 1 << 3,  // 8
};

/**
 * User-related database operations
 */
export class Users {
    /** @type {Connection} */
    #db;
    /** @type {string} */
    #tableName;

    /**
     * Create a new Users table manager
     * @param {Connection} connection - The database connection
     */
    constructor(connection) {
        this.#db = connection;
        this.#tableName = 'users';
    }

    /**
     * Initialize the users table
     * @returns {Promise<void>}
     */
    async init() {
        const query = `
            CREATE TABLE IF NOT EXISTS ${this.#tableName} (
                id VARCHAR(20) PRIMARY KEY,
                permissions BIGINT NOT NULL DEFAULT 0,
                access_token VARCHAR(255),
                refresh_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        await this.#db.execute(query);
    }

    /**
     * Create or update a user
     * @param {User} user - The user data to upsert
     * @returns {Promise<void>}
     */
    async upsert(user) {
        const query = `
            INSERT INTO ${this.#tableName} (id, permissions, access_token, refresh_token)
            VALUES (:id, :permissions, :accessToken, :refreshToken)
            ON DUPLICATE KEY UPDATE
                permissions = VALUES(permissions),
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token)
        `;
        await this.#db.execute(query, {
            id: user.id,
            permissions: user.permissions,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken
        });
    }

    /**
     * Get all users
     * @returns {Promise<User[]>}
     */
    async getAll() {
        const query = `SELECT * FROM ${this.#tableName}`;
        /** @type {[Array<any>, any]} */
        const [rows] = await this.#db.execute(query);
       return rows.map(row => ({
           id: row.id,
           permissions: row.permissions,
           accessToken: row.access_token,
           refreshToken: row.refresh_token
       }));
    }

    /**
     * Get a user by their Discord ID
     * @param {string} id - Discord user ID
     * @returns {Promise<User|null>}
     */
    async getById(id) {
        const query = `SELECT * FROM ${this.#tableName} WHERE id = :id`;
        /** @type {[Array<any>, any]} */
        const [rows] = await this.#db.execute(query, { id });
        const row = rows[0];
        
        if (!row) return null;

        return {
            id: row.id,
            permissions: row.permissions,
            accessToken: row.access_token,
            refreshToken: row.refresh_token
        };
    }

    /**
     * Update user access and refresh tokens
     * @param {string} id - Discord user ID
     * @param {string} accessToken - New access token
     * @param {string} refreshToken - New refresh token
     * @returns {Promise<void>}
     */
    async updateTokens(id, accessToken, refreshToken) {
        const query = `
            UPDATE ${this.#tableName}
            SET access_token = :accessToken, refresh_token = :refreshToken
            WHERE id = :id
        `;
        await this.#db.execute(query, { accessToken, refreshToken, id });
    }

    /**
     * Update user permissions
     * @param {string} id - Discord user ID
     * @param {number} permissions - New permissions value
     * @returns {Promise<void>}
     */
    async updatePermissions(id, permissions) {
        const query = `
            UPDATE ${this.#tableName}
            SET permissions = :permissions
            WHERE id = :id
        `;
        await this.#db.execute(query, { permissions, id });
    }

    /**
     * Update OAuth tokens
     * @param {string} id - Discord user ID
     * @param {any} DataPayload - New access and refresh tokens
     * @returns {Promise<void>}
     */
    async updateTokens(id, DataPayload) {
        const { accessToken, refreshToken } = DataPayload;
        const query = `
            UPDATE ${this.#tableName}
            SET access_token = :accessToken, refresh_token = :refreshToken
            WHERE id = :id
        `;
        await this.#db.execute(query, { accessToken, refreshToken, id });
    }

    /**
     * Delete a user
     * @param {string} id - Discord user ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const query = `DELETE FROM ${this.#tableName} WHERE id = :id`;
        await this.#db.execute(query, { id });
    }

    /**
     * Check if a user has specific permissions
     * @param {string} id - Discord user ID
     * @param {number} permission - Permission to check for
     * @returns {Promise<boolean>}
     */
    async hasPermission(id, permission) {
        const user = await this.getById(id);
        if (!user) return false;
        return (user.permissions & permission) === permission;
    }
}
