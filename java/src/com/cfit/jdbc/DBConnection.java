package com.cfit.jdbc;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * JDBC Database Connection Manager for C-FIT System:
 * - Resides in dedicated package: com.cfit.jdbc
 * - Connects via JDBC to MySQL (com.mysql.cj.jdbc.Driver)
 * - Supports environment variables & application.yml / db.properties overrides:
 *     DB_HOST (default: localhost)
 *     DB_PORT (default: 3306)
 *     DB_NAME (default: cfit_db)
 *     DB_USER (default: root)
 *     DB_PASS (default: root)
 * - Automatic schema bootstrapping (creates all tables on startup via DatabaseInitializer)
 * - Transparent fallback to SQLite JDBC when MySQL is offline
 * - Allows cross-device synchronization via centralized MySQL database
 */
public class DBConnection {

    private static boolean isInitialized = false;
    private static boolean usingMySQL = false;
    private static String activeStatusMessage = "JDBC connection uninitialized";

    static {
        JDBCConfig.loadConfiguration();
    }

    public static String getJdbcUrl() {
        return JDBCConfig.getMySQLJdbcUrl();
    }

    public static String getDbHost() {
        return JDBCConfig.getDbHost();
    }

    public static String getDbPort() {
        return JDBCConfig.getDbPort();
    }

    public static String getDbName() {
        return JDBCConfig.getDbName();
    }

    public static String getDbUser() {
        return JDBCConfig.getDbUser();
    }

    public static synchronized Connection getConnection() throws SQLException {
        // 1. Try MySQL JDBC Driver first
        try {
            Connection conn = ConnectionFactory.createMySQLConnection();
            usingMySQL = true;
            activeStatusMessage = "Connected to MySQL via JDBC (" + JDBCConfig.getDbHost() + ":" + JDBCConfig.getDbPort() + "/" + JDBCConfig.getDbName() + ")";
            if (!isInitialized) {
                DatabaseInitializer.initializeSchema(conn);
                isInitialized = true;
            }
            return conn;
        } catch (ClassNotFoundException | SQLException mySqlEx) {
            // 2. Fallback to SQLite JDBC embedded driver
            try {
                Connection sqliteConn = ConnectionFactory.createSQLiteConnection();
                usingMySQL = false;
                activeStatusMessage = "Connected to SQLite JDBC fallback (cfit.db). Centralized sync available when MySQL is online.";
                if (!isInitialized) {
                    DatabaseInitializer.initializeSchema(sqliteConn);
                    isInitialized = true;
                }
                return sqliteConn;
            } catch (Exception sqliteEx) {
                activeStatusMessage = "JDBC connection warning: " + mySqlEx.getMessage();
                throw new SQLException("Could not connect to database via JDBC at " + getJdbcUrl() + ": " + mySqlEx.getMessage(), mySqlEx);
            }
        }
    }

    public static String getStatusMessage() {
        return activeStatusMessage;
    }

    public static boolean isUsingMySQL() {
        return usingMySQL;
    }

    /**
     * Diagnostic helper: Tests if JDBC connection is working.
     */
    public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Safely closes a connection.
     */
    public static void closeConnection(Connection conn) {
        JDBCHelper.closeQuietly(conn);
    }
}
