import React, { useState, useEffect } from 'react';
import {
  Database,
  FileCode,
  Terminal,
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  Layers,
  Code
} from 'lucide-react';
import { getJdbcDemoInfo, getJdbcDemoSource } from '../api';

const DEFAULT_JAVA_SOURCE = `package com.bloodbank;

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
 * Blood Bank Management System (LifeFlow)
 * Academic JDBC Database Connectivity Demonstration
 * 
 * Architecture:
 *   Java Application -> JDBC API -> MySQL Driver -> MySQL Database
 */
public class DBConnection {

    private static final String DEFAULT_HOST = "localhost";
    private static final String DEFAULT_PORT = "3306";
    private static final String DEFAULT_DB   = "blood_bank_db";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASS = "";

    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    public static String getJdbcUrl() {
        String host = getEnvOrFallback("DB_HOST", DEFAULT_HOST);
        String port = getEnvOrFallback("DB_PORT", DEFAULT_PORT);
        String db   = getEnvOrFallback("DB_NAME", DEFAULT_DB);

        return "jdbc:mysql://" + host + ":" + port + "/" + db
             + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
    }

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName(JDBC_DRIVER);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC Driver Class Not Found: " + JDBC_DRIVER, e);
        }

        String url  = getJdbcUrl();
        String user = getEnvOrFallback("DB_USER", DEFAULT_USER);
        String pass = getEnvOrFallback("DB_PASSWORD", DEFAULT_PASS);

        return DriverManager.getConnection(url, user, pass);
    }

    public static boolean testConnection() {
        System.out.println("Testing JDBC Connection to MySQL database...");
        try (Connection conn = getConnection()) {
            if (conn != null && !conn.isClosed()) {
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT 1 AS test, DATABASE() AS db, VERSION() AS ver")) {
                    if (rs.next()) {
                        System.out.println("✅ JDBC Connection Successful!");
                        System.out.println("   Active Database : " + rs.getString("db"));
                        System.out.println("   MySQL Version   : " + rs.getString("ver"));
                        return true;
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("❌ JDBC Connection FAILED: " + e.getMessage());
            return false;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println("=== LifeFlow Blood Bank - Java JDBC Demonstration ===");
        boolean ok = testConnection();
        if (ok) {
            System.out.println("RESULT: JDBC CONNECTIVITY DEMONSTRATION SUCCESSFUL (OK)");
        } else {
            System.err.println("RESULT: JDBC CONNECTIVITY FAILED (ERROR)");
            System.exit(1);
        }
    }
}`;

export default function JdbcDemoSection({ defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [sourceCode, setSourceCode] = useState(DEFAULT_JAVA_SOURCE);
  const [copied, setCopied] = useState(false);
  const [apiInfo, setApiInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'commands' | 'output'

  useEffect(() => {
    // Attempt to fetch live source code and metadata from backend API
    getJdbcDemoInfo()
      .then(res => {
        if (res?.data) setApiInfo(res.data);
      })
      .catch(() => {});

    getJdbcDemoSource()
      .then(res => {
        if (res?.sourceCode) setSourceCode(res.sourceCode);
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const syntaxHighlight = (code) => {
    // Escape HTML entities
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.split('\n').map((line, idx) => {
      let formattedLine = line;

      // Comments
      if (formattedLine.trim().startsWith('//') || formattedLine.trim().startsWith('*') || formattedLine.trim().startsWith('/*') || formattedLine.trim().startsWith('/**')) {
        return (
          <div key={idx} style={{ display: 'flex', fontFamily: 'monospace', fontSize: '13px', lineHeight: '20px' }}>
            <span style={{ width: '45px', userSelect: 'none', color: 'rgba(255,255,255,0.25)', textAlign: 'right', paddingRight: '16px' }}>{idx + 1}</span>
            <span style={{ color: '#85929E', fontStyle: 'italic' }}>{line}</span>
          </div>
        );
      }

      // Strings
      formattedLine = formattedLine.replace(/(".*?")/g, '<span style="color: #98C379;">$1</span>');

      // Keywords
      const keywords = ['package', 'import', 'public', 'private', 'protected', 'class', 'static', 'final', 'void', 'return', 'try', 'catch', 'finally', 'new', 'throws', 'throw', 'if', 'else', 'while', 'for', 'null', 'true', 'false'];
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'g');
        formattedLine = formattedLine.replace(regex, '<span style="color: #C678DD; font-weight: 600;">$1</span>');
      });

      // Types & Classes
      const types = ['Connection', 'DriverManager', 'SQLException', 'Statement', 'ResultSet', 'DatabaseMetaData', 'String', 'boolean', 'int', 'Map', 'HashMap', 'File', 'BufferedReader', 'FileReader', 'IOException', 'Class', 'System'];
      types.forEach(tp => {
        const regex = new RegExp(`\\b(${tp})\\b`, 'g');
        formattedLine = formattedLine.replace(regex, '<span style="color: #E5C07B;">$1</span>');
      });

      return (
        <div key={idx} style={{ display: 'flex', fontFamily: 'monospace', fontSize: '13px', lineHeight: '20px' }}>
          <span style={{ width: '45px', userSelect: 'none', color: 'rgba(255,255,255,0.25)', textAlign: 'right', paddingRight: '16px' }}>{idx + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />
        </div>
      );
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card, #121217)',
      border: '1px solid rgba(220, 20, 60, 0.25)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      marginTop: 20
    }}>
      {/* Header Banner */}
      <div style={{
        padding: '20px 24px',
        borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.08)' : 'none',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: 'linear-gradient(180deg, rgba(220,20,60,0.06) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #DC143C, #8B0000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 14px rgba(220,20,60,0.3)',
            flexShrink: 0
          }}>
            <Code size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>
                JDBC Database Connectivity Demonstration
              </h3>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(220,20,60,0.15)',
                color: '#DC143C',
                border: '1px solid rgba(220,20,60,0.3)'
              }}>
                Academic Demo • DBMS
              </span>
              {apiInfo?.targetDatabase && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Target: {apiInfo.targetDatabase}:{apiInfo.targetPort}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted, #94A3B8)' }}>
              Standard Java Database Connectivity implementation for MySQL (<code>com.bloodbank.DBConnection</code>)
            </p>
          </div>
        </div>

        {/* Action Button: View JDBC Implementation */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          id="btn-view-jdbc-demo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            background: isExpanded ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #DC143C, #8B0000)',
            border: isExpanded ? '1px solid rgba(255,255,255,0.15)' : 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isExpanded ? 'none' : '0 2px 10px rgba(220,20,60,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          <Terminal size={16} />
          {isExpanded ? 'Hide JDBC Implementation' : 'View JDBC Implementation'}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Mandatory Architecture & Non-Replacement Notice */}
      <div style={{
        padding: '12px 24px',
        background: 'rgba(220, 20, 60, 0.05)',
        borderBottom: '1px solid rgba(220, 20, 60, 0.12)',
        fontSize: 12,
        color: 'var(--text-secondary, #CBD5E1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10
      }}>
        <Info size={16} color="#DC143C" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong style={{ color: '#DC143C' }}>Architecture Notice:</strong> This is a separate, standalone Java JDBC demonstration module for faculty academic submission. The active production web platform runs on <strong>Node.js/Express</strong> via the <code>mysql2</code> connection pool. Neither backend is replaced or modified by the other.
        </span>
      </div>

      {/* Expandable Demonstration Body */}
      {isExpanded && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. Brief Explanation of JDBC */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '18px 20px'
          }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={17} color="#DC143C" />
              What is JDBC & How It Works
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: '1.6', color: 'var(--text-secondary, #CBD5E1)' }}>
              <strong>JDBC (Java Database Connectivity)</strong> is the official Java Standard Edition API (<code>java.sql</code>) that defines how a Java client application establishes connections, sends SQL queries, and retrieves tabular result sets from relational databases. It utilizes a <strong>Type-4 Pure Java Driver</strong> (<code>com.mysql.cj.jdbc.Driver</code>) to communicate directly with MySQL Server over TCP port 3306.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 14
            }}>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>1. DRIVER REGISTRATION</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}><code>Class.forName("com.mysql.cj.jdbc.Driver")</code></div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>2. CONNECTION CREATION</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}><code>DriverManager.getConnection(url, user, pass)</code></div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>3. STATEMENT EXECUTION</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}><code>conn.createStatement().executeQuery(sql)</code></div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>4. RESOURCE CLEANUP</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}>Auto-closing try-with-resources statement</div>
              </div>
            </div>
          </div>

          {/* 2. Database Connectivity Architecture Diagram */}
          <div>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={17} color="#DC143C" />
              Database Connectivity Architecture Flow
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12,
              position: 'relative'
            }}>
              {/* Step 1 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>LAYER 1</span>
                  <FileCode size={16} color="#DC143C" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
                  Java Application
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)' }}>
                  <code>DBConnection.java</code> client code invoking <code>getConnection()</code> and <code>testConnection()</code>.
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>LAYER 2</span>
                  <Layers size={16} color="#DC143C" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
                  JDBC API
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)' }}>
                  Standard <code>java.sql.*</code> interfaces: <code>DriverManager</code>, <code>Connection</code>, <code>Statement</code>, <code>ResultSet</code>.
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>LAYER 3</span>
                  <Terminal size={16} color="#DC143C" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
                  MySQL Connector/J
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)' }}>
                  Type-4 Pure Java driver converting JDBC calls to MySQL binary network wire protocol packets.
                </div>
              </div>

              {/* Step 4 */}
              <div style={{
                background: 'rgba(220, 20, 60, 0.06)',
                border: '1px solid rgba(220, 20, 60, 0.25)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC143C' }}>LAYER 4</span>
                  <Database size={16} color="#DC143C" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
                  MySQL Database
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94A3B8)' }}>
                  Database: <code>blood_bank_db</code><br />
                  Port: <code>3306</code> (TCP/IP socket)
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sub-Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: 8
          }}>
            <button
              onClick={() => setActiveTab('code')}
              style={{
                background: activeTab === 'code' ? 'rgba(220,20,60,0.15)' : 'transparent',
                color: activeTab === 'code' ? '#DC143C' : 'var(--text-muted, #94A3B8)',
                border: activeTab === 'code' ? '1px solid rgba(220,20,60,0.3)' : '1px solid transparent',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <FileCode size={15} />
              Java Source (DBConnection.java)
            </button>

            <button
              onClick={() => setActiveTab('commands')}
              style={{
                background: activeTab === 'commands' ? 'rgba(220,20,60,0.15)' : 'transparent',
                color: activeTab === 'commands' ? '#DC143C' : 'var(--text-muted, #94A3B8)',
                border: activeTab === 'commands' ? '1px solid rgba(220,20,60,0.3)' : '1px solid transparent',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Terminal size={15} />
              Compile & Run Commands
            </button>

            <button
              onClick={() => setActiveTab('output')}
              style={{
                background: activeTab === 'output' ? 'rgba(220,20,60,0.15)' : 'transparent',
                color: activeTab === 'output' ? '#DC143C' : 'var(--text-muted, #94A3B8)',
                border: activeTab === 'output' ? '1px solid rgba(220,20,60,0.3)' : '1px solid transparent',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle size={15} />
              Verified Execution Outputs
            </button>
          </div>

          {/* Tab 1: Source Code Viewer */}
          {activeTab === 'code' && (
            <div style={{
              background: '#0D1117',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56', display: 'inline-block' }}></span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', display: 'inline-block' }}></span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F', display: 'inline-block' }}></span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#CBD5E1' }}>
                    jdbc-demo/src/main/java/com/bloodbank/DBConnection.java
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    color: copied ? '#4ADE80' : '#E2E8F0',
                    border: copied ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied Source!' : 'Copy Code'}
                </button>
              </div>

              <div style={{
                maxHeight: '480px',
                overflowY: 'auto',
                padding: '16px 8px',
                color: '#abb2bf',
                userSelect: 'text'
              }}>
                {syntaxHighlight(sourceCode)}
              </div>
            </div>
          )}

          {/* Tab 2: Compile & Run Commands */}
          {activeTab === 'commands' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                padding: '18px 20px'
              }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#DC143C' }}>
                  METHOD A: ONE-CLICK CONVENIENCE RUNNER (NO MAVEN REQUIRED)
                </h5>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted, #94A3B8)' }}>
                  Windows PowerShell runner script that compiles with the bundled MySQL Connector JAR and executes immediately:
                </p>
                <pre style={{
                  background: '#0D1117',
                  padding: '14px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#4ADE80',
                  margin: 0,
                  overflowX: 'auto'
                }}>powershell -ExecutionPolicy Bypass -File jdbc-demo/run-demo.ps1</pre>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                padding: '18px 20px'
              }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#DC143C' }}>
                  METHOD B: STANDARD JAVAC & JAVA (UNIVERSAL JDK)
                </h5>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted, #94A3B8)' }}>
                  Manual command line instructions using standard JDK tools:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary, #CBD5E1)', fontWeight: 600 }}>1. Compile Java Source:</span>
                    <pre style={{
                      background: '#0D1117',
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#E2E8F0',
                      margin: '4px 0 0',
                      overflowX: 'auto'
                    }}>javac -encoding UTF-8 -cp "jdbc-demo/lib/mysql-connector-j-8.0.33.jar" jdbc-demo/src/main/java/com/bloodbank/DBConnection.java</pre>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary, #CBD5E1)', fontWeight: 600 }}>2. Run JDBC Demonstration:</span>
                    <pre style={{
                      background: '#0D1117',
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#4ADE80',
                      margin: '4px 0 0',
                      overflowX: 'auto'
                    }}>java -cp "jdbc-demo/src/main/java;jdbc-demo/lib/mysql-connector-j-8.0.33.jar" com.bloodbank.DBConnection</pre>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                padding: '18px 20px'
              }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#DC143C' }}>
                  METHOD C: APACHE MAVEN (POM.XML CONFIGURED)
                </h5>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted, #94A3B8)' }}>
                  If Maven is installed in your development environment:
                </p>
                <pre style={{
                  background: '#0D1117',
                  padding: '14px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#4ADE80',
                  margin: 0,
                  overflowX: 'auto'
                }}>cd jdbc-demo && mvn compile exec:java</pre>
              </div>
            </div>
          )}

          {/* Tab 3: Verified Execution Outputs */}
          {activeTab === 'output' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Success Result Box */}
              <div style={{
                background: '#0D1117',
                borderRadius: 12,
                border: '1px solid rgba(74, 222, 128, 0.3)',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={18} color="#4ADE80" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80' }}>
                    SUCCESS SCENARIO (VERIFIED ON LOCAL MYSQL 8.4)
                  </span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#CBD5E1',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto'
                }}>
{`================================================================================
         LifeFlow Blood Bank Management System - JDBC Demonstration             
                 Academic Module (com.bloodbank.DBConnection)                   
================================================================================
Architecture: Java Application -> JDBC API -> MySQL Driver -> MySQL Database
Environment Config:
  • DB_HOST     : localhost
  • DB_PORT     : 3306
  • DB_NAME     : blood_bank_db
  • DB_USER     : root
  • DB_PASSWORD : ******** [PROTECTED]
--------------------------------------------------------------------------------
Testing JDBC Connection to MySQL database...
Target JDBC URL: jdbc:mysql://localhost:3306/blood_bank_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8
Target DB User : root
✅ JDBC Connection Successful!
   Active Database : blood_bank_db
   MySQL Version   : 8.4.9

--------------------------------------------------------------------------------
  Executing Live JDBC Metadata & Table Verification Query...
--------------------------------------------------------------------------------
• Database Product : MySQL v8.4.9
• JDBC Driver      : MySQL Connector/J vmysql-connector-j-8.0.33
• JDBC Compliance  : JDBC 4.2
• Read-Only Mode   : false
• Auto-Commit Mode : true

[Schema Verification Query]:
  +-------------------------------------------------------------+
  | Entity Table            | Record Count (Verified via JDBC)  |
  +-------------------------------------------------------------+
  | blood_bank              | 10                                |
  | donor                   | 11                                |
  | receiver                | 10                                |
  | blood_unit              | 10                                |
  | blood_request           | 10                                |
  +-------------------------------------------------------------+

================================================================================
  RESULT: JDBC CONNECTIVITY DEMONSTRATION COMPLETED SUCCESSFULLY (STATUS: OK)
================================================================================`}
                </pre>
              </div>

              {/* Handled Failure Box */}
              <div style={{
                background: '#0D1117',
                borderRadius: 12,
                border: '1px solid rgba(220, 20, 60, 0.3)',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Info size={18} color="#DC143C" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#DC143C' }}>
                    FAILURE HANDLING SCENARIO (DEMONSTRATES EXCEPTION REPORTING)
                  </span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#CBD5E1',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto'
                }}>
{`❌ JDBC Connection FAILED!
   Error Message : Access denied for user 'root'@'localhost' (using password: YES)
   SQL State     : 28000
   Vendor Code   : 1045

--- Academic Troubleshooting Guidance ---
1. Check MySQL Service: Ensure MySQL server is running locally on port 3306.
2. Check Database: Verify database 'blood_bank_db' exists in MySQL.
3. Check Credentials: Set DB_USER and DB_PASSWORD environment variables if root password differs.
4. Check Driver: Verify mysql-connector-j jar is present in classpath or pom.xml.
-----------------------------------------
RESULT: JDBC CONNECTIVITY DEMONSTRATION FAILED (STATUS: ERROR)`}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
