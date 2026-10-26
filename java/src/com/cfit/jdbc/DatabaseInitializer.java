package com.cfit.jdbc;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * JDBC Database Initializer:
 * Responsible for executing Data Definition Language (DDL) statements via JDBC,
 * creating tables for Members, Staff, Trainers, Attendance, Payments, and Classes.
 * Handles dialect variations between MySQL (AUTO_INCREMENT) and SQLite (AUTOINCREMENT).
 */
public class DatabaseInitializer {

    public static void initializeSchema(Connection conn) {
        if (conn == null) return;

        // Try standard MySQL syntax first
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

            // 7. Class Bookings
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS class_bookings (" +
                    "id INT PRIMARY KEY AUTO_INCREMENT," +
                    "class_id INT NOT NULL," +
                    "member_id VARCHAR(50) NOT NULL," +
                    "booked_at VARCHAR(50) NOT NULL" +
                    ")");

            System.out.println("[JDBC] Database tables verified & initialized successfully via MySQL JDBC.");
        } catch (SQLException e) {
            // Dialect fallback for SQLite syntax
            try (Statement fallbackStmt = conn.createStatement()) {
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, plan_type TEXT NOT NULL, trainer_id INTEGER, join_date TEXT NOT NULL, expiry_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Staff', email TEXT, phone TEXT, shift TEXT DEFAULT 'Morning', status TEXT DEFAULT 'Active', can_manage_members INTEGER DEFAULT 1, can_process_payments INTEGER DEFAULT 1, can_manage_classes INTEGER DEFAULT 1, can_manage_trainers INTEGER DEFAULT 1, created_at TEXT)");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS trainers (id INTEGER PRIMARY KEY AUTOINCREMENT, trainer_code TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, specialty TEXT NOT NULL, rating REAL DEFAULT 5.0)");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, check_in_time TEXT NOT NULL, check_out_time TEXT, check_in_method TEXT DEFAULT 'Reception Desk')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, plan_description TEXT NOT NULL, amount REAL NOT NULL, due_date TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'Paid')");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, class_name TEXT NOT NULL, trainer_id INTEGER NOT NULL, studio_location TEXT NOT NULL, start_time TEXT NOT NULL, max_capacity INTEGER NOT NULL, booked_count INTEGER DEFAULT 0)");
                fallbackStmt.executeUpdate("CREATE TABLE IF NOT EXISTS class_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER NOT NULL, member_id TEXT NOT NULL, booked_at TEXT NOT NULL)");
                System.out.println("[JDBC] Fallback SQLite database tables verified & initialized successfully.");
            } catch (Exception ex) {
                System.err.println("[JDBC WARN] Table initialization error: " + ex.getMessage());
            }
        }
    }
}
