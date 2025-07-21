import mysql from 'mysql2/promise';
import { Users } from './tables/users.js';
import { Sessions } from './tables/sessions.js';
import { Tickets } from './tables/tickets.js';

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} host - Database host
 * @property {string} user - Database username
 * @property {string} password - Database password
 * @property {string} database - Database name
 * @property {number} [port] - Database port (default: 3306)
 * @property {boolean} [ssl] - Enable SSL connection
 * @property {string} [charset] - Character set (default: utf8mb4)
 * @property {string} [timezone] - Timezone (default: Z)
 */

/**
 * Database manager class that handles connections and provides access to tables
 * Optimized for MariaDB compatibility
 */

export class DatabaseManager {
    /** @type {DatabaseManager | undefined} */
    static #instance;
    /** @type {import('mysql2/promise').Pool | undefined} */
    #pool;
    /** @type {Users | undefined} */
    #users;
    /** @type {Sessions | undefined} */
    #sessions;
    /** @type {Tickets | undefined} */
    #tickets;

    /**
     * Get the DatabaseManager instance
     * @param {DatabaseConfig} [config] - Database configuration
     * @returns {DatabaseManager}
     */
    static getInstance(config) {
        if (!DatabaseManager.#instance) {
            if (!config) {
                throw new Error('Configuration required for first initialization');
            }
            DatabaseManager.#instance = new DatabaseManager(config);
        }
        return DatabaseManager.#instance;
    }

    /**
     * Create a new database manager instance
     * @param {DatabaseConfig} config - Database configuration
     */
    constructor(config) {
        if (DatabaseManager.#instance) {
            throw new Error('DatabaseManager is a singleton. Use getInstance() instead.');
        }
        this.config = {
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            port: config.port || 3306,
            // MariaDB optimized settings
            charset: config.charset || 'utf8mb4',
            timezone: config.timezone || 'Z',
            ssl: false,
            // Connection pool settings
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            // MariaDB specific optimizations
            namedPlaceholders: true,
            supportBigNumbers: true,
            bigNumberStrings: true,
            dateStrings: false,
            // Enable multiple statement execution (use with caution)
            multipleStatements: false,
            // MariaDB connection flags
            flags: [
                'FOUND_ROWS',
                'IGNORE_SPACE',
                'PROTOCOL_41',
                'TRANSACTIONS',
                'RESERVED',
                'SECURE_CONNECTION',
                'MULTI_RESULTS',
                'PS_MULTI_RESULTS'
            ]
        };
    }

    /**
     * Initialize the database connection pool and tables
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Create connection pool instead of single connection for better performance
            this.#pool = mysql.createPool(this.config);

            // Test the connection
            const connection = await this.#pool.getConnection();
            
            // Verify MariaDB version and capabilities
            const [rows] = await connection.execute('SELECT VERSION() as version');
            const version = rows[0].version;
            console.log(`Connected to MariaDB version: ${version}`);
            
            // Set session variables for optimal MariaDB performance
            await connection.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
            await connection.execute('SET SESSION innodb_strict_mode = ON');
            
            connection.release();

            // Initialize tables
            this.#users = new Users(this.#pool);
            await this.#users.init();

            this.#sessions = new Sessions(this.#pool);
            await this.#sessions.init();

            this.#tickets = new Tickets(this.#pool);
            await this.#tickets.init();

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Close the database connection pool
     * @returns {Promise<void>}
     */
    async close() {
        if (this.#pool) {
            try {
                await this.#pool.end();
                this.#pool = undefined;
                this.#users = undefined;
                this.#sessions = undefined;
                this.#tickets = undefined;
                DatabaseManager.#instance = undefined;
                console.log('Database connection pool closed');
            } catch (error) {
                console.error('Error closing database pool:', error);
                throw error;
            }
        }
    }

    /**
     * Get the Users table manager
     * @returns {Users}
     * @throws {Error} If the database is not initialized
     */
    get users() {
        if (!this.#pool || !this.#users ) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.#users;
    }

    get sessions() {
        if (!this.#pool || !this.#sessions) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.#sessions;
    }

    get tickets() {
        if (!this.#pool || !this.#tickets) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.#tickets;
    }


    /**
     * Get a connection from the pool
     * @returns {Promise<import('mysql2/promise').PoolConnection>}
     */
    async getConnection() {
        if (!this.#pool) throw new Error('Database not initialized');
        return await this.#pool.getConnection();
    }

    /**
     * Execute a query using the pool
     * @param {string} sql - SQL query
     * @param {any[]} [params] - Query parameters
     * @returns {Promise<any>}
     */
    async query(sql, params = []) {
        if (!this.#pool) throw new Error('Database not initialized');
        return await this.#pool.execute(sql, params);
    }

    /**
     * Execute a function within a transaction
     * @template T
     * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<T>} fn - Function to execute
     * @returns {Promise<T>}
     */
    async transaction(fn) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await fn(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Check database health
     * @returns {Promise<{connected: boolean, version: string, uptime: number}>}
     */
    async healthCheck() {
        try {
            const [versionRows] = await this.query('SELECT VERSION() as version');
            const [uptimeRows] = await this.query('SHOW STATUS LIKE "Uptime"');
            
            return {
                connected: true,
                version: versionRows[0].version,
                uptime: parseInt(uptimeRows[0].Value)
            };
        } catch (error) {
            return {
                connected: false,
                version: 'unknown',
                uptime: 0,
                error: error.message
            };
        }
    }

    /**
     * Get connection pool statistics
     * @returns {Object}
     */
    getPoolStats() {
        if (!this.#pool) return null;
        
        return {
            totalConnections: this.#pool.config.connectionLimit,
            activeConnections: this.#pool.pool._allConnections.length,
            idleConnections: this.#pool.pool._freeConnections.length,
            queuedRequests: this.#pool.pool._connectionQueue.length
        };
    }

    /**
     * Enable query logging (for development)
     * @param {boolean} enable - Whether to enable logging
     */
    setQueryLogging(enable) {
        if (this.#pool) {
            this.#pool.config.debug = enable;
        }
    }
}