package com.cfit.jdbc;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * JDBC Connection Factory:
 * Implements the Factory Design Pattern to manufacture and validate JDBC connections
 * to MySQL on localhost:3306 (primary database) or SQLite (embedded fallback).
 */
public class ConnectionFactory {

    /**
     * Direct explicit localhost MySQL JDBC connection URL (Port 3306, Database: cfit_db)
     */
    public static final String LOCALHOST_MYSQL_URL = 
            "jdbc:mysql://localhost:3306/cfit_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";

    /**
     * Creates a new JDBC connection to MySQL.
     * By default connects to localhost:3306/cfit_db with user 'root'.
     *
     * Example:
     *   Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/cfit_db", "root", "root");
     */
    public static Connection createMySQLConnection() throws SQLException, ClassNotFoundException {
        Class.forName(JDBCConfig.getDriverClassName());
        String url = JDBCConfig.getMySQLJdbcUrl(); // Defaults to jdbc:mysql://localhost:3306/cfit_db...
        return DriverManager.getConnection(
                url,
                JDBCConfig.getDbUser(),
                JDBCConfig.getDbPass()
        );
    }

    /**
     * Explicit direct localhost MySQL connection method.
     * Connects directly to MySQL server on localhost:3306.
     */
    public static Connection createLocalHostConnection() throws SQLException, ClassNotFoundException {
        Class.forName("com.mysql.cj.jdbc.Driver");
        return DriverManager.getConnection(LOCALHOST_MYSQL_URL, "root", "root");
    }

    /**
     * Creates a new JDBC connection to the embedded SQLite database file (cfit.db).
     * Note: SQLite is a serverless local file database, so it does not connect to a network host.
     */
    public static Connection createSQLiteConnection() throws SQLException, ClassNotFoundException {
        Class.forName("org.sqlite.JDBC");
        return DriverManager.getConnection(JDBCConfig.getSQLiteJdbcUrl());
    }

    /**
     * Validates if a given JDBC connection is open and responsive.
     */
    public static boolean isConnectionValid(Connection conn, int timeoutSeconds) {
        if (conn == null) return false;
        try {
            return !conn.isClosed() && conn.isValid(timeoutSeconds);
        } catch (SQLException e) {
            return false;
        }
    }
}
