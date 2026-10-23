# ============================================================================
#  LifeFlow JDBC Demonstration Runner Script (PowerShell)
# ============================================================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[JDBC DEMO] Compiling DBConnection.java..." -ForegroundColor Cyan
javac -encoding UTF-8 -cp "lib/mysql-connector-j-8.0.33.jar" src/main/java/com/bloodbank/DBConnection.java

if ($LASTEXITCODE -eq 0) {
    Write-Host "[JDBC DEMO] Compilation successful. Running com.bloodbank.DBConnection..." -ForegroundColor Green
    java -cp "src/main/java;lib/mysql-connector-j-8.0.33.jar" com.bloodbank.DBConnection
} else {
    Write-Host "[JDBC DEMO] Compilation failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
