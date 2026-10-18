package com.cfit.db;

import java.io.InputStream;
import java.sql.*;
import java.util.Properties;

/**
 * JDBC Database Connection Manager for C-FIT System:
 * - Connects via JDBC to MySQL (com.mysql.cj.jdbc.Driver)
 * - Supports environment variables & application.yml / db.properties overrides:
 *     DB_HOST (default: localhost)
 *     DB_PORT (default: 3306)
 *     DB_NAME (default: cfit_db)
 *     DB_USER (default: root)
 *     DB_PASS (default: root)
 * - Automatic schema bootstrapping (creates all tables on startup)
 * - Allows cross-device synchronization via centralized MySQL database
 */
public class DBConnection {

    private static String dbHost = "localhost";
    private static String dbPort = "3306";
    private static String dbName = "cfit_db";
    private static String dbUser = "root";
    private static String dbPass = "root";

    private static boolean isInitialized = false;
    private static boolean usingMySQL = false;
    private static String activeStatusMessage = "Initializing...";

    static {
        loadConfiguration();
    }

    private static void loadConfiguration() {
        // 1. Read environment variables if provided
        String envHost = System.getenv("DB_HOST");
        if (envHost != null && !envHost.trim().isEmpty()) dbHost = envHost.trim();

        String envPort = System.getenv("DB_PORT");
        if (envPort != null && !envPort.trim().isEmpty()) dbPort = envPort.trim();

        String envName = System.getenv("DB_NAME");
        if (envName != null && !envName.trim().isEmpty()) dbName = envName.trim();

        String envUser = System.getenv("DB_USER");
        if (envUser != null && !envUser.trim().isEmpty()) dbUser = envUser.trim();

        String envPass = System.getenv("DB_PASS");
        if (envPass != null) dbPass = envPass.trim();

        // 2. Read db.properties if exists
        try (InputStream is = DBConnection.class.getResourceAsStream("/db.properties")) {
            if (is != null) {
                Properties props = new Properties();
                props.load(is);
                if (props.getProperty("db.host") != null) dbHost = props.getProperty("db.host");
                if (props.getProperty("db.port") != null) dbPort = props.getProperty("db.port");
                if (props.getProperty("db.name") != null) dbName = props.getProperty("db.name");
                if (props.getProperty("db.user") != null) dbUser = props.getProperty("db.user");
                if (props.getProperty("db.password") != null) dbPass = props.getProperty("db.password");
            }
        } catch (Exception ignored) {}
    }

    public static String getJdbcUrl() {
        return "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                + "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    }

    public static synchronized Connection getConnection() throws SQLException {
        // Try MySQL Driver first
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(getJdbcUrl(), dbUser, dbPass);
            usingMySQL = true;
            activeStatusMessage = "Connected to MySQL via JDBC (" + dbHost + ":" + dbPort + "/" + dbName + ")";
            if (!isInitialized) {
                initializeSchema(conn);
                isInitialized = true;
            }
            return conn;
        } catch (ClassNotFoundException | SQLException mySqlEx) {
            // If MySQL is not running on localhost, fallback to SQLite JDBC
            try {
                Class.forName("org.sqlite.JDBC");
                Connection sqliteConn = DriverManager.getConnection("jdbc:sqlite:cfit.db");
                usingMySQL = false;
                activeStatusMessage = "Connected to SQLite JDBC fallback (cfit.db). Start MySQL for centralized cross-device sync.";
                if (!isInitialized) {
                    initializeSchema(sqliteConn);
                    isInitialized = true;
                }
                return sqliteConn;
            } catch (Exception sqliteEx) {
                activeStatusMessage = "JDBC connection warning: " + mySqlEx.getMessage();
                throw new SQLException("Could not connect to MySQL at " + getJdbcUrl() + ": " + mySqlEx.getMessage(), mySqlEx);
            }
        }
    }

    public static String getStatusMessage() {
        return activeStatusMessage;
    }

    public static boolean isUsingMySQL() {
        return usingMySQL;
    }

    private static void initializeSchema(Connection conn) {
        try (Statement stmt = conn.createStatement()) {
            // 1. Members
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS members (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "member_id VARCHAR(50) UNIQUE NOT NULL," +
                    "full_name VARCHAR(120) NOT NULL," +
                    "plan_type VARCHAR(50) NOT NULL," +
                    "trainer_id INT," +
                    "join_date VARCHAR(30) NOT NULL," +
                    "expiry_date VARCHAR(30) NOT NULL," +
                    "status VARCHAR(30) NOT NULL DEFAULT 'Active'" +
                    ")");

            // 2. Staff users
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS staff_users (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "username VARCHAR(60) UNIQUE NOT NULL," +
                    "password VARCHAR(100) NOT NULL," +
                    "full_name VARCHAR(120) NOT NULL," +
                    "role VARCHAR(30) NOT NULL DEFAULT 'Staff'," +
                    "email VARCHAR(120)," +
                    "phone VARCHAR(40)," +
                    "shift VARCHAR(40) DEFAULT 'Morning'," +
                    "status VARCHAR(30) DEFAULT 'Active'," +
                    "can_manage_members INT DEFAULT 1," +
                    "can_process_payments INT DEFAULT 1," +
                    "can_manage_classes INT DEFAULT 1," +
                    "can_manage_trainers INT DEFAULT 1," +
                    "created_at VARCHAR(40)" +
                    ")");

            // 3. Trainers
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS trainers (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "trainer_code VARCHAR(50) UNIQUE NOT NULL," +
                    "full_name VARCHAR(120) NOT NULL," +
                    "specialty VARCHAR(120) NOT NULL," +
                    "rating DOUBLE DEFAULT 5.0" +
                    ")");

            // 4. Attendance
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS attendance (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "member_id VARCHAR(50) NOT NULL," +
                    "check_in_time VARCHAR(50) NOT NULL," +
                    "check_out_time VARCHAR(50)," +
                    "check_in_method VARCHAR(50) DEFAULT 'Reception Desk'" +
                    ")");

            // 5. Payments
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS payments (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "member_id VARCHAR(50) NOT NULL," +
                    "plan_description VARCHAR(150) NOT NULL," +
                    "amount DOUBLE NOT NULL," +
                    "due_date VARCHAR(40) NOT NULL," +
                    "payment_status VARCHAR(30) NOT NULL DEFAULT 'Paid'" +
                    ")");

            // 6. Classes
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS classes (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "class_name VARCHAR(120) NOT NULL," +
                    "trainer_id INT NOT NULL," +
                    "studio_location VARCHAR(100) NOT NULL," +
                    "start_time VARCHAR(50) NOT NULL," +
                    "max_capacity INT NOT NULL," +
                    "booked_count INT DEFAULT 0" +
                    ")");

            System.out.println("[JDBC] Database tables initialized successfully via JDBC.");
        } catch (SQLException e) {
            // Some databases (like SQLite) use AUTOINCREMENT instead of AUTO_INCREMENT
            try (Statement fallbackStmt = conn.createStatement()) {
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, plan_type TEXT NOT NULL, trainer_id INTEGER, join_date TEXT NOT NULL, expiry_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Staff', email TEXT, phone TEXT, shift TEXT DEFAULT 'Morning', status TEXT DEFAULT 'Active', can_manage_members INTEGER DEFAULT 1, can_process_payments INTEGER DEFAULT 1, can_manage_classes INTEGER DEFAULT 1, can_manage_trainers INTEGER DEFAULT 1, created_at TEXT)");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS trainers (id INTEGER PRIMARY KEY AUTOINCREMENT, trainer_code TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, specialty TEXT NOT NULL, rating REAL DEFAULT 5.0)");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, check_in_time TEXT NOT NULL, check_out_time TEXT, check_in_method TEXT DEFAULT 'Reception Desk')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, plan_description TEXT NOT NULL, amount REAL NOT NULL, due_date TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'Paid')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, class_name TEXT NOT NULL, trainer_id INTEGER NOT NULL, studio_location TEXT NOT NULL, start_time TEXT NOT NULL, max_capacity INTEGER NOT NULL, booked_count INTEGER DEFAULT 0)");
                System.out.println("[JDBC] Fallback SQLite tables initialized successfully.");
            } catch (Exception ignored) {}
        }
    }
}
