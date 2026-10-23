@echo off
REM ============================================================================
REM  LifeFlow JDBC Demonstration Runner Script (Windows CMD)
REM ============================================================================
echo [JDBC DEMO] Compiling DBConnection.java...
javac -encoding UTF-8 -cp "lib\mysql-connector-j-8.0.33.jar" src\main\java\com\bloodbank\DBConnection.java
if %errorlevel% neq 0 (
    echo [JDBC DEMO] Compilation failed.
    exit /b %errorlevel%
)
echo [JDBC DEMO] Compilation successful.
echo [JDBC DEMO] Running com.bloodbank.DBConnection...
java -cp "src\main\java;lib\mysql-connector-j-8.0.33.jar" com.bloodbank.DBConnection
