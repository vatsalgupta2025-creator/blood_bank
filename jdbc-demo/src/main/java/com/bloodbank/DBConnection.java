package com.bloodbank;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * Blood Bank Management System (LifeFlow)
 * Academic JDBC Database Connectivity Demonstration
 * ============================================================================
 * 
 * Architecture Layer:
 *   [Java Application / Client]
 *              │
 *              ▼
 *      [JDBC API (java.sql)]
 *              │
 *              ▼
 *   [MySQL Driver (Connector/J)]
 *              │
 *              ▼
 *    [MySQL Database Server]  (blood_bank_db : 3306)
 * 
 * Note:
 *   This is a standalone academic demonstration showing standard Java Database
 *   Connectivity (JDBC). The main production web backend is powered by Node.js/Express
 *   and connects to MySQL via the mysql2 connection pool. This demonstration operates
 *   independently and does not interfere with the active web application.
 */
public class DBConnection {

    // Default connection parameters (matching local schema configuration)
    private static final String DEFAULT_HOST = "localhost";
    private static final String DEFAULT_PORT = "3306";
    private static final String DEFAULT_DB   = "blood_bank_db";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASS = "";

    // Primary MySQL Connector/J driver class (MySQL 8.0+)
    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    // Legacy fallback driver class for older connector jars
    private static final String LEGACY_DRIVER = "com.mysql.jdbc.Driver";

    // Cached environment/config map for fallback resolution
    private static Map<String, String> dotEnvMap = null;

    /**
     * Resolves a configuration property with priority:
     * 1. System environment variable
     * 2. Local/backend .env file (for local development convenience)
     * 3. Built-in academic default
     */
    private static String getEnvOrFallback(String key, String defaultValue) {
        String sysVal = System.getenv(key);
        if (sysVal != null && !sysVal.trim().isEmpty()) {
            return sysVal.trim();
        }

        // Lazy load .env fallback if present
        if (dotEnvMap == null) {
            dotEnvMap = loadDotEnv();
        }
        if (dotEnvMap.containsKey(key) && !dotEnvMap.get(key).trim().isEmpty()) {
            return dotEnvMap.get(key).trim();
        }

        return defaultValue;
    }

    /**
     * Helper to read .env from current directory, parent directory, or backend directory.
     * Prevents requiring manual environment variable exports when running in student IDEs.
     */
    private static Map<String, String> loadDotEnv() {
        Map<String, String> map = new HashMap<>();
        String[] possiblePaths = {
            ".env",
            "../.env",
            "backend/.env",
            "../backend/.env",
            "../../backend/.env"
        };

        for (String p : possiblePaths) {
            File f = new File(p);
            if (f.exists() && f.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String k = line.substring(0, eq).trim();
                            String v = line.substring(eq + 1).trim();
                            if ((v.startsWith("\"") && v.endsWith("\"")) ||
                                (v.startsWith("'") && v.endsWith("'"))) {
                                v = v.substring(1, v.length() - 1);
                            }
                            if (!map.containsKey(k)) {
                                map.put(k, v);
                            }
                        }
                    }
                    break; // Stop after finding the closest .env file
                } catch (IOException ignored) {}
            }
        }
        return map;
    }

    /**
     * Constructs the standard JDBC URL for MySQL with secure parameters:
     * - useSSL=false (for local development, configurable)
     * - allowPublicKeyRetrieval=true (for MySQL 8 caching_sha2_password authentication)
     * - serverTimezone=UTC
     */
    public static String getJdbcUrl() {
        String host = getEnvOrFallback("DB_HOST", DEFAULT_HOST);
        String port = getEnvOrFallback("DB_PORT", DEFAULT_PORT);
        String db   = getEnvOrFallback("DB_NAME", DEFAULT_DB);

        return "jdbc:mysql://" + host + ":" + port + "/" + db
             + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
    }

    public static String getDbUser() {
        return getEnvOrFallback("DB_USER", DEFAULT_USER);
    }

    public static String getDbPassword() {
        return getEnvOrFallback("DB_PASSWORD", DEFAULT_PASS);
    }

    public static String getDbHost() {
        return getEnvOrFallback("DB_HOST", DEFAULT_HOST);
    }

    public static String getDbPort() {
        return getEnvOrFallback("DB_PORT", DEFAULT_PORT);
    }

    public static String getDbName() {
        return getEnvOrFallback("DB_NAME", DEFAULT_DB);
    }

    /**
     * Registers the MySQL JDBC driver and establishes a new JDBC Connection.
     * 
     * @return java.sql.Connection object
     * @throws SQLException if a database access error occurs or the url is null
     */
    public static Connection getConnection() throws SQLException {
        // Step 1: Ensure MySQL JDBC Driver is registered in DriverManager
        try {
            Class.forName(JDBC_DRIVER);
        } catch (ClassNotFoundException e1) {
            try {
                Class.forName(LEGACY_DRIVER);
            } catch (ClassNotFoundException e2) {
                System.err.println("❌ ERROR: MySQL JDBC Driver not found on classpath!");
                System.err.println("   Please ensure mysql-connector-j is included in pom.xml or the classpath.");
                throw new SQLException("MySQL JDBC Driver Class Not Found: " + JDBC_DRIVER, e1);
            }
        }

        // Step 2: Establish the connection using DriverManager
        String url  = getJdbcUrl();
        String user = getDbUser();
        String pass = getDbPassword();

        return DriverManager.getConnection(url, user, pass);
    }

    /**
     * Tests whether the database connection succeeds and executes a verification query.
     * Connection and Statement are cleanly closed in try-with-resources.
     * 
     * @return true if connection succeeds, false otherwise
     */
    public static boolean testConnection() {
        System.out.println("Testing JDBC Connection to MySQL database...");
        System.out.println("Target JDBC URL: " + getJdbcUrl());
        System.out.println("Target DB User : " + getDbUser());

        try (Connection conn = getConnection()) {
            if (conn != null && !conn.isClosed()) {
                // Execute a lightweight test query
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT 1 AS connection_test, DATABASE() AS current_db, VERSION() AS db_version")) {
                    if (rs.next()) {
                        String currentDb = rs.getString("current_db");
                        String dbVersion = rs.getString("db_version");
                        System.out.println("✅ JDBC Connection Successful!");
                        System.out.println("   Active Database : " + currentDb);
                        System.out.println("   MySQL Version   : " + dbVersion);
                        return true;
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            System.err.println("❌ JDBC Connection FAILED!");
            System.err.println("   Error Message : " + e.getMessage());
            System.err.println("   SQL State     : " + e.getSQLState());
            System.err.println("   Vendor Code   : " + e.getErrorCode());
            printTroubleshootingTips(e);
            return false;
        }
        return false;
    }

    /**
     * Prints helpful troubleshooting guidance when connection fails.
     */
    private static void printTroubleshootingTips(SQLException e) {
        System.err.println("\n--- Academic Troubleshooting Guidance ---");
        System.err.println("1. Check MySQL Service: Ensure MySQL server is running locally on port " + getDbPort() + ".");
        System.err.println("2. Check Database: Verify database '" + getDbName() + "' exists in MySQL.");
        System.err.println("3. Check Credentials: Set DB_USER and DB_PASSWORD environment variables if root password differs.");
        System.err.println("   PowerShell example: $env:DB_PASSWORD=\"your_password\"");
        System.err.println("   Bash example      : export DB_PASSWORD=\"your_password\"");
        System.err.println("4. Check Driver: Verify mysql-connector-j jar is present in classpath or pom.xml.");
        System.err.println("-----------------------------------------\n");
    }

    /**
     * Main method demonstrating JDBC connectivity and querying sample records
     * from the blood_bank_db schema for academic demonstration.
     */
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("         LifeFlow Blood Bank Management System - JDBC Demonstration             ");
        System.out.println("                 Academic Module (com.bloodbank.DBConnection)                   ");
        System.out.println("================================================================================");
        System.out.println("Architecture: Java Application -> JDBC API -> MySQL Driver -> MySQL Database");
        System.out.println("Environment Config:");
        System.out.println("  • DB_HOST     : " + getDbHost());
        System.out.println("  • DB_PORT     : " + getDbPort());
        System.out.println("  • DB_NAME     : " + getDbName());
        System.out.println("  • DB_USER     : " + getDbUser());
        System.out.println("  • DB_PASSWORD : " + (getDbPassword().isEmpty() ? "(empty/none)" : "******** [PROTECTED]"));
        System.out.println("--------------------------------------------------------------------------------");

        boolean success = testConnection();

        if (success) {
            System.out.println("\n--------------------------------------------------------------------------------");
            System.out.println("  Executing Live JDBC Metadata & Table Verification Query...");
            System.out.println("--------------------------------------------------------------------------------");

            try (Connection conn = getConnection()) {
                DatabaseMetaData metaData = conn.getMetaData();
                System.out.println("• Database Product : " + metaData.getDatabaseProductName() + " v" + metaData.getDatabaseProductVersion());
                System.out.println("• JDBC Driver      : " + metaData.getDriverName() + " v" + metaData.getDriverVersion());
                System.out.println("• JDBC Compliance  : JDBC " + metaData.getJDBCMajorVersion() + "." + metaData.getJDBCMinorVersion());
                System.out.println("• Read-Only Mode   : " + conn.isReadOnly());
                System.out.println("• Auto-Commit Mode : " + conn.getAutoCommit());

                // Inspect blood_bank_db table counts via JDBC Statement and ResultSet
                System.out.println("\n[Schema Verification Query]:");
                String query = "SELECT " +
                               "(SELECT COUNT(*) FROM blood_bank) AS banks_count, " +
                               "(SELECT COUNT(*) FROM donor) AS donors_count, " +
                               "(SELECT COUNT(*) FROM receiver) AS receivers_count, " +
                               "(SELECT COUNT(*) FROM blood_unit) AS units_count, " +
                               "(SELECT COUNT(*) FROM blood_request) AS requests_count";

                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(query)) {
                    if (rs.next()) {
                        System.out.printf("  +-------------------------------------------------------------+\n");
                        System.out.printf("  | Entity Table            | Record Count (Verified via JDBC)  |\n");
                        System.out.printf("  +-------------------------------------------------------------+\n");
                        System.out.printf("  | blood_bank              | %-33d |\n", rs.getInt("banks_count"));
                        System.out.printf("  | donor                   | %-33d |\n", rs.getInt("donors_count"));
                        System.out.printf("  | receiver                | %-33d |\n", rs.getInt("receivers_count"));
                        System.out.printf("  | blood_unit              | %-33d |\n", rs.getInt("units_count"));
                        System.out.printf("  | blood_request           | %-33d |\n", rs.getInt("requests_count"));
                        System.out.printf("  +-------------------------------------------------------------+\n");
                    }
                }

                System.out.println("\n================================================================================");
                System.out.println("  RESULT: JDBC CONNECTIVITY DEMONSTRATION COMPLETED SUCCESSFULLY (STATUS: OK)");
                System.out.println("================================================================================");

            } catch (SQLException e) {
                System.err.println("❌ Error during JDBC query demonstration: " + e.getMessage());
            }
        } else {
            System.err.println("\n================================================================================");
            System.err.println("  RESULT: JDBC CONNECTIVITY DEMONSTRATION FAILED (STATUS: ERROR)");
            System.err.println("================================================================================");
            System.exit(1);
        }
    }
}
