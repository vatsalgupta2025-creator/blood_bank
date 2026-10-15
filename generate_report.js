const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, TableOfContents,
  PageBreak
} = require("docx");
const fs = require("fs");

const C = {
  crimson: "8B0000", darkRed: "5C0000", accent: "DC143C",
  headerBg: "8B0000", rowAlt: "FFF5F5", headFg: "FFFFFF",
  border: "CCCCCC", muted: "666666",
};

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 4 } },
    children: [new TextRun({ text, bold: true, color: C.darkRed, size: 36, font: "Arial" })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: C.crimson, size: 28, font: "Arial" })]
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun("")] }));
}
function headerCell(text, width) {
  return new TableCell({
    borders: allBorders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: C.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: C.headFg, size: 20, font: "Arial" })] })]
  });
}
function dataCell(text, width, alt = false, bold = false) {
  return new TableCell({
    borders: allBorders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: alt ? C.rowAlt : "FFFFFF", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, font: "Arial", bold })] })]
  });
}
function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 1))
      }))
    ]
  });
}
function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    spacing: { before: 0, after: 0 }, indent: { left: 360 },
    children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "333333" })]
  }));
}

const doc = new Document({
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: C.darkRed },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.crimson },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 } } },
    headers: { default: new Header({ children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 2 } },
      tabStops: [{ type: "right", position: 9360 }],
      children: [
        new TextRun({ text: "LifeFlow - Blood Bank Management System", bold: true, size: 18, font: "Arial", color: C.crimson }),
        new TextRun({ text: "\tDBMS Project Report", size: 18, font: "Arial", color: C.muted })
      ]
    })]}) },
    footers: { default: new Footer({ children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 2 } },
      tabStops: [{ type: "right", position: 9360 }],
      children: [
        new TextRun({ text: "DBMS Project - Academic Report", size: 18, font: "Arial", color: C.muted }),
        new TextRun({ text: "\tPage ", size: 18, font: "Arial", color: C.muted }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: C.muted }),
      ]
    })]}) },
    children: [
      // COVER
      ...spacer(4),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LifeFlow", size: 96, bold: true, font: "Arial", color: C.darkRed })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Blood Bank Management System", size: 48, font: "Arial", color: C.crimson })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 },
        border: { top: { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 4 }, bottom: { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 4 } },
        children: [new TextRun({ text: "DBMS Project Report", size: 36, bold: true, font: "Arial", color: C.accent })] }),
      ...spacer(2),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Stack: React | Node.js | Express.js | MySQL | JWT", size: 22, font: "Arial", color: C.muted, italics: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "Database: Aiven Cloud (MySQL 8.x)", size: 22, font: "Arial", color: C.muted, italics: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "GitHub: github.com/vatsalgupta2025-creator/blood_bank", size: 22, font: "Arial", color: C.muted, italics: true })] }),
      ...spacer(6), pageBreak(),

      // TOC
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      pageBreak(),

      // 1. INTRODUCTION
      h1("1. Introduction"),
      para("Blood is a critical and irreplaceable medical resource. The management of blood banks - from donor registration to inventory tracking and emergency transfusion request fulfillment - is a complex, multi-stakeholder process that has traditionally relied on paper records and disconnected siloed systems."),
      para("LifeFlow is a comprehensive, web-based Blood Bank Management System that fully digitizes and centralizes all blood bank operations. It connects donors, patients (receivers), blood bank staff, doctors, and administrators on a single, secure, and intelligent platform."),
      para("The system provides real-time visibility into blood inventory levels broken down by blood group, manages the complete lifecycle of blood donation events and transfusion requests, and supports multiple user roles with granular role-based access control."),
      pageBreak(),

      // 2. PROBLEM STATEMENT
      h1("2. Problem Statement"),
      para("Traditional manual blood bank management suffers from several critical inefficiencies:"),
      bullet("Inventory inefficiencies: Difficulty tracking available blood units, expiry dates, and blood group availability across multiple centers simultaneously."),
      bullet("Poor request handling: Lack of a centralized system to prioritize and manage urgent transfusion requests leads to delays in emergency situations."),
      bullet("Donor information silos: No unified database to track donor eligibility, medical history, and donation frequency."),
      bullet("Slow emergency response: Communication delays between hospitals and blood banks during critical life-threatening situations."),
      bullet("Limited reporting: No data-driven insights into inventory trends, donation patterns, or individual center performance."),
      bullet("Manual errors: Paper-based records are prone to data entry errors, duplication, and loss."),
      para("LifeFlow addresses all of the above by providing a single, real-time, role-aware platform for every stakeholder in the blood bank ecosystem."),
      pageBreak(),

      // 3. OBJECTIVES
      h1("3. Objectives"),
      numbered("Design and implement a normalized relational MySQL database schema for all blood bank operations."),
      numbered("Build a secure Node.js/Express REST API with JWT authentication and role-based access control (RBAC)."),
      numbered("Develop an intuitive React SPA frontend with full CRUD capabilities for all entities."),
      numbered("Implement a real-time operational dashboard with inventory status, urgent request tracking, and donation activity feeds."),
      numbered("Ensure the system is fully responsive across Desktop, Tablet, and Mobile devices."),
      numbered("Provide an Admin SQL Console and Database Verification panel for advanced oversight."),
      numbered("Maintain strict data integrity through foreign key constraints, cascade rules, and input validation."),
      pageBreak(),

      // 4. ARCHITECTURE
      h1("4. System Architecture"),
      para("The project follows a standard 3-Tier Client-Server Architecture with a clear separation of concerns between presentation, application logic, and data storage."),
      h2("4.1 Architecture Tiers"),
      ...codeBlock([
        "  CLIENT (Presentation Tier)",
        "  React 19 | Vite | Tailwind CSS | Axios",
        "  Responsive SPA: Desktop / Tablet / Mobile",
        "          |",
        "          | REST API (HTTP/JSON)",
        "          |",
        "  APPLICATION SERVER (Logic Tier)",
        "  Node.js | Express.js | JWT Auth | RBAC Middleware",
        "          |",
        "          | MySQL Protocol (SSL/TLS)",
        "          |",
        "  DATABASE (Data Tier)",
        "  MySQL 8.x | Aiven Cloud | Connection Pool",
        "  Normalized Relational Schema | ACID Compliant",
      ]),
      h2("4.2 Data Flow"),
      para("The frontend communicates exclusively with the backend REST API using Axios. All API requests to protected routes include a JWT token in the Authorization header. The Express middleware verifies the token before passing the request to the corresponding controller, which then queries the MySQL database via a connection pool and returns JSON responses."),
      pageBreak(),

      // 5. TECH STACK
      h1("5. Technology Stack"),
      h2("5.1 Frontend Technologies"),
      makeTable(["Technology", "Version", "Purpose"],
        [["React", "19", "UI component library, SPA with hooks"],
         ["Vite", "8", "Build tool, dev server, Hot Module Replacement"],
         ["Tailwind CSS", "v4", "Utility-first CSS framework for styling"],
         ["Lucide React", "Latest", "Icon library (SVG-based, tree-shakeable)"],
         ["Axios", "Latest", "HTTP client for REST API communication"],
         ["React Router", "v7", "Client-side routing and navigation"]], [3000, 1500, 4860]),
      ...spacer(1),
      h2("5.2 Backend Technologies"),
      makeTable(["Technology", "Version", "Purpose"],
        [["Node.js", "v22", "JavaScript runtime environment"],
         ["Express.js", "v4", "Web framework for routing and middleware"],
         ["MySQL2", "Latest", "Database driver with Promise/async support"],
         ["JWT", "Latest", "Stateless, secure authentication tokens"],
         ["bcrypt", "Latest", "Password hashing and verification"],
         ["dotenv", "Latest", "Environment variable management"],
         ["CORS", "Latest", "Cross-Origin Resource Sharing configuration"]], [3000, 1500, 4860]),
      ...spacer(1),
      h2("5.3 Database and Infrastructure"),
      makeTable(["Component", "Detail"],
        [["Database Engine", "MySQL 8.x"],
         ["Hosting", "Aiven Cloud (Managed MySQL with SSL/TLS)"],
         ["Connection Strategy", "mysql2/promise connection pooling"],
         ["Security", "TLS encrypted connections with CA certificate"]], [4000, 5360]),
      pageBreak(),

      // 6. DATABASE
      h1("6. Database Design"),
      para("The database is designed following 3rd Normal Form (3NF) to eliminate redundancy and ensure data integrity. The schema consists of 8 primary tables connected through well-defined foreign key relationships."),
      h2("6.1 blood_bank"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["bank_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique center identifier"],
         ["name", "VARCHAR(200)", "NOT NULL", "Name of the blood bank center"],
         ["city", "VARCHAR(100)", "NOT NULL", "City where center is located"],
         ["state", "VARCHAR(100)", "NOT NULL", "State/Province"],
         ["capacity", "INT", "NOT NULL", "Maximum unit storage capacity"],
         ["phone", "VARCHAR(15)", "--", "Contact phone number"],
         ["email", "VARCHAR(100)", "--", "Contact email address"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.2 donor"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["donor_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique donor ID"],
         ["first_name", "VARCHAR(100)", "NOT NULL", "Donor's first name"],
         ["last_name", "VARCHAR(100)", "--", "Donor's last name"],
         ["dob", "DATE", "--", "Date of birth"],
         ["gender", "ENUM", "Male/Female/Other", "Gender of donor"],
         ["blood_group", "ENUM", "NOT NULL", "Blood group (A+, A-, B+, etc.)"],
         ["phone", "VARCHAR(15)", "NOT NULL", "Contact phone"],
         ["email", "VARCHAR(100)", "--", "Contact email"],
         ["is_eligible", "TINYINT(1)", "DEFAULT 1", "1 = eligible to donate"],
         ["total_donations", "INT", "Computed", "Count of donation events"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.3 receiver (Patient)"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["receiver_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique receiver ID"],
         ["first_name", "VARCHAR(100)", "NOT NULL", "Patient first name"],
         ["last_name", "VARCHAR(100)", "--", "Patient last name"],
         ["blood_group", "ENUM", "NOT NULL", "Required blood group"],
         ["hospital_name", "VARCHAR(200)", "--", "Hospital requesting blood"],
         ["hospital_city", "VARCHAR(100)", "--", "City of the hospital"],
         ["urgency", "ENUM", "Normal/Urgent/Critical", "Priority level"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.4 blood_unit"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["unit_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique unit/bag identifier"],
         ["blood_group", "ENUM", "NOT NULL", "Blood group of this unit"],
         ["collection_date", "DATE", "NOT NULL", "Date blood was collected"],
         ["expiry_date", "DATE", "NOT NULL", "Expiry date of the unit"],
         ["status", "ENUM", "NOT NULL", "Available/Used/Expired/Tested"],
         ["bank_id", "INT", "FK -> blood_bank", "Which center stores this unit"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.5 blood_request"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["request_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique request ID"],
         ["receiver_id", "INT", "FK -> receiver", "Patient making the request"],
         ["bank_id", "INT", "FK -> blood_bank", "Fulfilling blood bank center"],
         ["blood_group", "ENUM", "NOT NULL", "Blood group required"],
         ["quantity", "INT", "NOT NULL", "Number of units requested"],
         ["required_by", "DATE", "--", "Deadline date for fulfillment"],
         ["status", "ENUM", "NOT NULL", "Pending/Approved/Fulfilled/Rejected"],
         ["urgency", "ENUM", "NOT NULL", "Normal/Urgent/Critical"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.6 donation_event"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["event_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique event ID"],
         ["donor_id", "INT", "FK -> donor (CASCADE)", "Donor who donated"],
         ["bank_id", "INT", "FK -> blood_bank", "Receiving blood bank center"],
         ["event_date", "DATE", "NOT NULL", "Date of donation"],
         ["blood_group", "ENUM", "--", "Blood group donated"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.7 blood_test"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["test_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique test record ID"],
         ["unit_id", "INT", "FK -> blood_unit", "Blood unit being tested"],
         ["test_type", "VARCHAR(100)", "NOT NULL", "Type of screening test"],
         ["result", "ENUM", "NOT NULL", "Passed/Failed/Pending"],
         ["tested_by", "VARCHAR(100)", "--", "Technician name"],
         ["test_date", "DATE", "NOT NULL", "Date of test"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.8 staff (Users)"),
      makeTable(["Column", "Data Type", "Constraint", "Description"],
        [["staff_id", "INT", "PRIMARY KEY, AUTO_INCREMENT", "Unique staff member ID"],
         ["name", "VARCHAR(150)", "NOT NULL", "Full name of staff"],
         ["email", "VARCHAR(100)", "UNIQUE, NOT NULL", "Login email address"],
         ["password", "VARCHAR(255)", "NOT NULL", "bcrypt-hashed password"],
         ["role", "ENUM", "NOT NULL", "Admin/Doctor/Nurse/Technician"],
         ["bank_id", "INT", "FK -> blood_bank", "Home blood bank center"]], [1800, 2000, 2400, 3160]),
      ...spacer(1),
      h2("6.9 Relationships Summary"),
      makeTable(["Relationship", "Type", "Constraint"],
        [["donor -> donation_event", "One-to-Many", "FK donor_id; ON DELETE CASCADE"],
         ["blood_bank -> donation_event", "One-to-Many", "FK bank_id"],
         ["blood_bank -> blood_unit", "One-to-Many", "FK bank_id"],
         ["blood_unit -> blood_test", "One-to-One", "FK unit_id"],
         ["receiver -> blood_request", "One-to-Many", "FK receiver_id"],
         ["blood_bank -> blood_request", "One-to-Many", "FK bank_id"],
         ["blood_bank -> staff", "One-to-Many", "FK bank_id"]], [3400, 2000, 3960]),
      pageBreak(),

      // 7. API
      h1("7. API Design and Backend Structure"),
      para("The Express server exposes a clean RESTful API under the /api prefix. All protected routes require a valid JWT Bearer token in the Authorization header."),
      h2("7.1 API Endpoints"),
      makeTable(["Module", "Base Route", "Supported Operations"],
        [["Auth", "/api/auth", "POST /login"],
         ["Dashboard", "/api/dashboard", "GET / (summary stats + inventory)"],
         ["Blood Banks", "/api/blood-banks", "GET, POST, PUT /:id, DELETE /:id"],
         ["Donors", "/api/donors", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Receivers", "/api/receivers", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Blood Units", "/api/blood-units", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Blood Requests", "/api/blood-requests", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Donation Events", "/api/donation-events", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Blood Tests", "/api/blood-tests", "GET (filters), POST, PUT /:id, DELETE /:id"],
         ["Staff", "/api/staff", "GET, POST, PUT /:id, DELETE /:id"],
         ["SQL Console", "/api/sql", "POST /query (Admin only)"],
         ["DB Verification", "/api/db-verification", "GET / (Admin only)"]], [1800, 2800, 4760]),
      pageBreak(),

      // 8. FRONTEND
      h1("8. Frontend Modules and Features"),
      h2("8.1 Dashboard"),
      bullet("Hero Section: Live system tagline with Find Blood and Donate Blood CTAs."),
      bullet("Statistics Strip: Available Blood Units, Eligible Donors, Connected Banks, Pending Requests."),
      bullet("Blood Group Inventory: 8 blood-group cards with unit counts and low-stock alerts."),
      bullet("Urgent Requests Panel: Top 5 active Critical/Urgent requests with badges."),
      bullet("Recent Activity Feed: Latest 5 donation events with donor and bank details."),
      bullet("System Modules Grid: 8 quick-access navigation cards for all operational modules."),
      h2("8.2 CRUD Pages (All Modules)"),
      bullet("Filter Bar: Search inputs and dropdowns for blood group, city, status, role, date range."),
      bullet("Column Selector: Popover to show/hide individual table columns."),
      bullet("DataTable: Fully sortable table with per-row Edit and Delete actions."),
      bullet("Mobile Card View: Automatic card-based layout on screens under 768px."),
      bullet("Add/Edit Modal: Forms with field-level validation and async submission."),
      bullet("Confirm Delete Dialog: Secondary confirmation before any destructive action."),
      bullet("Toast Notifications: Non-blocking success/error banners for all operations."),
      h2("8.3 Admin-Only Panels"),
      bullet("SQL Console: Terminal-style interface for raw SELECT query execution against live MySQL."),
      bullet("DB Verification: Pre-configured CRUD integrity checks with pass/fail status reporting."),
      pageBreak(),

      // 9. AUTH
      h1("9. Authentication and Security"),
      h2("9.1 JWT Authentication Flow"),
      ...codeBlock([
        "Client  ->  POST /api/auth/login  ->  Server",
        "            { email, password }",
        "",
        "Server validates: finds user by email, compares bcrypt hash",
        "On success: signs JWT { staff_id, name, role, bank_id }",
        "",
        "Token stored in localStorage (key: bb_user)",
        "All requests: Authorization: Bearer <token>",
        "authMiddleware.js verifies -> attaches req.user -> next()",
        "Invalid/expired token -> 401 Unauthorized",
      ]),
      ...spacer(1),
      h2("9.2 Role-Based Access Control"),
      makeTable(["Role", "Donors/Receivers", "Blood Units/Banks", "Requests/Events/Tests", "SQL Console", "DB Verify"],
        [["Admin", "Full CRUD", "Full CRUD", "Full CRUD", "YES", "YES"],
         ["Doctor", "Full CRUD", "Read Only", "Full CRUD", "No", "No"],
         ["Nurse", "Full CRUD", "Read Only", "Read Only", "No", "No"],
         ["Technician", "Read Only", "Full CRUD", "Tests: Full CRUD", "No", "No"]], [2000, 1800, 1800, 1700, 1000, 1060]),
      ...spacer(1),
      para("RBAC is enforced at both the API middleware level and the UI navigation level for defense in depth. Admin-only navigation items are conditionally rendered based on the JWT role."),
      pageBreak(),

      // 10. RESPONSIVE
      h1("10. Responsive Design"),
      h2("10.1 Breakpoints"),
      makeTable(["Breakpoint", "Range", "Layout Behaviour"],
        [["Desktop", "> 1024px", "Full nav bar, multi-column grids, complete horizontal data tables"],
         ["Tablet", "641px-1024px", "Hamburger nav drawer, 2-column grids, single-column forms"],
         ["Mobile", "< 640px", "Vertical stacked layout, card-based data view, no horizontal scrolling"]], [1500, 2200, 5660]),
      ...spacer(1),
      h2("10.2 Key Adaptations"),
      bullet("TopHeader: Desktop shows full nav links. Mobile shows hamburger button opening a full-height side drawer that auto-closes on route changes."),
      bullet("DataTable to Mobile Cards: On screens under 768px, the HTML table is replaced by stacked label-value card items, eliminating horizontal scrolling."),
      bullet("Dashboard Grids: Hero section, stats strip, inventory, and module grids use CSS Grid with responsive column counts (4 -> 2 -> 1)."),
      bullet("Filter Bars: Inline inputs reflow into 2-column grid on tablet and single column on mobile."),
      bullet("Touch Targets: Minimum 44px touch target for all interactive buttons on mobile."),
      pageBreak(),

      // 11. SQL
      h1("11. Key SQL Queries"),
      h2("11.1 Blood Group Inventory"),
      ...codeBlock(["SELECT blood_group, COUNT(*) AS count", "FROM blood_unit", "WHERE status = 'Available'", "GROUP BY blood_group", "ORDER BY blood_group;"]),
      para("Aggregates available blood units per blood group for the real-time dashboard inventory grid."),
      ...spacer(1),
      h2("11.2 Monthly Donation Trend"),
      ...codeBlock(["SELECT DATE_FORMAT(event_date, '%b %Y') AS month, COUNT(*) AS count", "FROM donation_event", "WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)", "GROUP BY DATE_FORMAT(event_date, '%Y-%m')", "ORDER BY DATE_FORMAT(event_date, '%Y-%m') ASC;"]),
      para("Aggregates donation counts per month over the past 6 months for trend analysis."),
      ...spacer(1),
      h2("11.3 Filtered Donor Search with JOIN"),
      ...codeBlock(["SELECT d.*, COUNT(e.event_id) AS total_donations, MAX(e.event_date) AS last_donation", "FROM donor d", "LEFT JOIN donation_event e ON d.donor_id = e.donor_id", "WHERE d.first_name LIKE '%search%' AND d.city = 'Mumbai' AND d.blood_group = 'O+'", "GROUP BY d.donor_id ORDER BY d.first_name ASC;"]),
      para("Parameterised query joining donors with their donation history. Supports multi-field filtering."),
      ...spacer(1),
      h2("11.4 Cascade Delete"),
      ...codeBlock(["-- ON DELETE CASCADE on donation_event.donor_id", "DELETE FROM donor WHERE donor_id = 42;", "-- All donation_event rows with donor_id=42 are automatically removed"]),
      para("ON DELETE CASCADE ensures referential integrity - deleting a donor removes all their donation records automatically."),
      pageBreak(),

      // 12. CONCLUSION
      h1("12. Conclusion"),
      para("The LifeFlow Blood Bank Management System successfully demonstrates the real-world application of DBMS principles within a critical healthcare domain. Key achievements:"),
      bullet("Robust Data Modelling: Fully normalized (3NF) MySQL schema with 8 entities, foreign key constraints, cascade rules, and enumerated type constraints guaranteeing data integrity."),
      bullet("Full-Stack Integration: Clean separation of concerns between the React SPA, Node.js/Express REST API, and MySQL database connected by well-defined JSON API contracts."),
      bullet("Enterprise-Grade Security: JWT-based stateless authentication with RBAC enforced at both API middleware and UI navigation levels."),
      bullet("Outstanding Usability: Fully responsive interface adapting from complex sortable tables on desktop to touch-friendly card stacks on mobile."),
      bullet("Operational Transparency: Admin SQL Console and DB Verification panels provide real-time data visibility and control."),
      bullet("Scalability: Connection-pooled database, stateless JWT, and component-based React architecture support horizontal scaling."),
      para("The project demonstrates that a well-designed relational database combined with a modern full-stack web application can significantly improve the efficiency and responsiveness of critical healthcare logistics like blood bank management."),
      pageBreak(),

      // APPENDIX
      h1("Appendix - Project Repository"),
      para("Full source code: https://github.com/vatsalgupta2025-creator/blood_bank", { bold: true }),
      ...spacer(1),
      h2("Directory Structure"),
      ...codeBlock([
        "frontend/src/",
        "  api/index.js              - Axios instance + all API functions",
        "  components/TopHeader.jsx  - Navigation (desktop + mobile drawer)",
        "  components/DataTable.jsx  - Sortable table with mobile card fallback",
        "  components/Modal.jsx      - Reusable dialog component",
        "  components/Badges.jsx     - BloodGroupBadge, UrgencyBadge, etc.",
        "  context/ToastContext.jsx  - Global toast notification system",
        "  pages/DashboardPage.jsx   - Main dashboard with all widgets",
        "  pages/DonorsPage.jsx      - Donor CRUD module",
        "  pages/ReceiversPage.jsx   - Receiver/patient CRUD module",
        "  pages/BloodBanksPage.jsx  - Blood bank center CRUD",
        "  pages/BloodUnitsPage.jsx  - Inventory CRUD",
        "  pages/BloodRequestsPage.jsx - Request lifecycle management",
        "  App.jsx                   - Root component, routing, protected routes",
        "  index.css                 - CSS tokens, responsive media queries",
        "",
        "backend/",
        "  config/db.js              - MySQL connection pool",
        "  controllers/*.js          - One controller per resource",
        "  middleware/authMiddleware.js - JWT verification",
        "  routes/*.js               - One route file per resource",
        "  server.js                 - Express entry point",
      ]),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("LifeFlow_DBMS_Project_Report.docx", buffer);
  console.log("Report generated: LifeFlow_DBMS_Project_Report.docx");
}).catch(err => { console.error("Error:", err); });
