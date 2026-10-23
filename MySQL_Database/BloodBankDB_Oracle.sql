-- Blood Bank Database - Oracle SQL Script
-- Run this file in Oracle SQL*Plus / SQL Developer
-- This script creates all tables and inserts sample data.

SET DEFINE OFF;

-- =========================
-- TABLE: Donor
-- =========================
CREATE TABLE Donor (
    donor_id NUMBER PRIMARY KEY,
    donor_name VARCHAR2(100) NOT NULL,
    gender VARCHAR2(10),
    blood_group VARCHAR2(5),
    address VARCHAR2(200),
    dob DATE
);

INSERT INTO Donor VALUES (1, 'Rahul Sharma', 'Male', 'A+', 'Delhi', DATE '2000-05-12');
INSERT INTO Donor VALUES (2, 'Priya Singh', 'Female', 'B+', 'Mumbai', DATE '1999-08-21');
INSERT INTO Donor VALUES (3, 'Amit Kumar', 'Male', 'O+', 'Jaipur', DATE '2001-02-15');
INSERT INTO Donor VALUES (4, 'Neha Verma', 'Female', 'AB+', 'Lucknow', DATE '1998-11-30');
INSERT INTO Donor VALUES (5, 'Rohit Gupta', 'Male', 'A-', 'Delhi', DATE '2000-07-19');
INSERT INTO Donor VALUES (6, 'Anjali Mehta', 'Female', 'O-', 'Pune', DATE '2002-01-10');
INSERT INTO Donor VALUES (7, 'Karan Malhotra', 'Male', 'B-', 'Chandigarh', DATE '1997-09-25');
INSERT INTO Donor VALUES (8, 'Simran Kaur', 'Female', 'AB-', 'Amritsar', DATE '2001-12-05');
INSERT INTO Donor VALUES (9, 'Vikas Yadav', 'Male', 'A+', 'Kanpur', DATE '1999-04-18');
INSERT INTO Donor VALUES (10, 'Pooja Sharma', 'Female', 'O+', 'Bhopal', DATE '2000-06-22');

-- =========================
-- TABLE: Donor_Phone
-- =========================
CREATE TABLE Donor_Phone (
    donor_id NUMBER,
    phone_no VARCHAR2(15),
    PRIMARY KEY (donor_id, phone_no),
    FOREIGN KEY (donor_id) REFERENCES Donor(donor_id)
);

INSERT INTO Donor_Phone VALUES (1, '9876543210');
INSERT INTO Donor_Phone VALUES (2, '9876543211');
INSERT INTO Donor_Phone VALUES (3, '9876543212');
INSERT INTO Donor_Phone VALUES (4, '9876543213');
INSERT INTO Donor_Phone VALUES (5, '9876543214');
INSERT INTO Donor_Phone VALUES (6, '9876543215');
INSERT INTO Donor_Phone VALUES (7, '9876543216');
INSERT INTO Donor_Phone VALUES (8, '9876543217');
INSERT INTO Donor_Phone VALUES (9, '9876543218');
INSERT INTO Donor_Phone VALUES (10, '9876543219');

-- =========================
-- TABLE: Recipient
-- =========================
CREATE TABLE Recipient (
    recipient_id NUMBER PRIMARY KEY,
    recipient_name VARCHAR2(100) NOT NULL,
    age NUMBER,
    blood_group VARCHAR2(5),
    address VARCHAR2(200),
    gender VARCHAR2(10)
);

INSERT INTO Recipient VALUES (101, 'Arjun Mehta', 25, 'A+', 'Delhi', 'Male');
INSERT INTO Recipient VALUES (102, 'Sneha Kapoor', 32, 'B+', 'Mumbai', 'Female');
INSERT INTO Recipient VALUES (103, 'Ravi Patel', 45, 'O+', 'Ahmedabad', 'Male');
INSERT INTO Recipient VALUES (104, 'Kavya Nair', 28, 'AB+', 'Kochi', 'Female');
INSERT INTO Recipient VALUES (105, 'Manish Jain', 51, 'A-', 'Jaipur', 'Male');
INSERT INTO Recipient VALUES (106, 'Isha Sharma', 22, 'O-', 'Pune', 'Female');
INSERT INTO Recipient VALUES (107, 'Suresh Kumar', 60, 'B-', 'Chandigarh', 'Male');
INSERT INTO Recipient VALUES (108, 'Meera Singh', 35, 'AB-', 'Amritsar', 'Female');
INSERT INTO Recipient VALUES (109, 'Aditya Verma', 40, 'A+', 'Lucknow', 'Male');
INSERT INTO Recipient VALUES (110, 'Nisha Gupta', 29, 'O+', 'Bhopal', 'Female');

-- =========================
-- TABLE: Recipient_Phone
-- =========================
CREATE TABLE Recipient_Phone (
    recipient_id NUMBER,
    phone_no VARCHAR2(15),
    PRIMARY KEY (recipient_id, phone_no),
    FOREIGN KEY (recipient_id) REFERENCES Recipient(recipient_id)
);

INSERT INTO Recipient_Phone VALUES (101, '9123456780');
INSERT INTO Recipient_Phone VALUES (102, '9123456781');
INSERT INTO Recipient_Phone VALUES (103, '9123456782');
INSERT INTO Recipient_Phone VALUES (104, '9123456783');
INSERT INTO Recipient_Phone VALUES (105, '9123456784');
INSERT INTO Recipient_Phone VALUES (106, '9123456785');
INSERT INTO Recipient_Phone VALUES (107, '9123456786');
INSERT INTO Recipient_Phone VALUES (108, '9123456787');
INSERT INTO Recipient_Phone VALUES (109, '9123456788');
INSERT INTO Recipient_Phone VALUES (110, '9123456789');

-- =========================
-- TABLE: Blood_Bank
-- =========================
CREATE TABLE Blood_Bank (
    bank_id NUMBER PRIMARY KEY,
    bank_name VARCHAR2(100) NOT NULL,
    city VARCHAR2(50),
    state VARCHAR2(50),
    pincode VARCHAR2(10)
);

INSERT INTO Blood_Bank VALUES (1, 'City Blood Bank', 'Delhi', 'Delhi', '110001');
INSERT INTO Blood_Bank VALUES (2, 'LifeCare Blood Bank', 'Mumbai', 'Maharashtra', '400001');
INSERT INTO Blood_Bank VALUES (3, 'Jaipur Blood Centre', 'Jaipur', 'Rajasthan', '302001');
INSERT INTO Blood_Bank VALUES (4, 'Lucknow Blood Bank', 'Lucknow', 'Uttar Pradesh', '226001');
INSERT INTO Blood_Bank VALUES (5, 'Pune Blood Centre', 'Pune', 'Maharashtra', '411001');
INSERT INTO Blood_Bank VALUES (6, 'Chandigarh Blood Bank', 'Chandigarh', 'Chandigarh', '160001');
INSERT INTO Blood_Bank VALUES (7, 'Amritsar Blood Centre', 'Amritsar', 'Punjab', '143001');
INSERT INTO Blood_Bank VALUES (8, 'Kanpur Blood Bank', 'Kanpur', 'Uttar Pradesh', '208001');
INSERT INTO Blood_Bank VALUES (9, 'Bhopal Blood Centre', 'Bhopal', 'Madhya Pradesh', '462001');
INSERT INTO Blood_Bank VALUES (10, 'Ahmedabad Blood Bank', 'Ahmedabad', 'Gujarat', '380001');

-- =========================
-- TABLE: Donation
-- =========================
CREATE TABLE Donation (
    donor_id NUMBER,
    donation_no NUMBER,
    donation_date DATE,
    bank_id NUMBER,
    PRIMARY KEY (donor_id, donation_no),
    FOREIGN KEY (donor_id) REFERENCES Donor(donor_id),
    FOREIGN KEY (bank_id) REFERENCES Blood_Bank(bank_id)
);

INSERT INTO Donation VALUES (1, 1001, DATE '2026-01-10', 1);
INSERT INTO Donation VALUES (2, 1002, DATE '2026-01-15', 2);
INSERT INTO Donation VALUES (3, 1003, DATE '2026-02-05', 3);
INSERT INTO Donation VALUES (4, 1004, DATE '2026-02-12', 4);
INSERT INTO Donation VALUES (5, 1005, DATE '2026-02-20', 1);
INSERT INTO Donation VALUES (6, 1006, DATE '2026-03-01', 5);
INSERT INTO Donation VALUES (7, 1007, DATE '2026-03-08', 6);
INSERT INTO Donation VALUES (8, 1008, DATE '2026-03-15', 7);
INSERT INTO Donation VALUES (9, 1009, DATE '2026-03-20', 8);
INSERT INTO Donation VALUES (10, 1010, DATE '2026-03-25', 9);

-- =========================
-- TABLE: Blood_Unit
-- =========================
CREATE TABLE Blood_Unit (
    unit_id NUMBER PRIMARY KEY,
    donor_id NUMBER,
    donation_no NUMBER,
    blood_group VARCHAR2(5),
    quantity NUMBER,
    collection_date DATE,
    expiry_date DATE,
    status VARCHAR2(30),
    FOREIGN KEY (donor_id, donation_no)
        REFERENCES Donation(donor_id, donation_no)
);

INSERT INTO Blood_Unit VALUES (2001, 1, 1001, 'A+', 1, DATE '2026-01-10', DATE '2026-03-21', 'Available');
INSERT INTO Blood_Unit VALUES (2002, 2, 1002, 'B+', 1, DATE '2026-01-15', DATE '2026-03-26', 'Available');
INSERT INTO Blood_Unit VALUES (2003, 3, 1003, 'O+', 1, DATE '2026-02-05', DATE '2026-04-21', 'Available');
INSERT INTO Blood_Unit VALUES (2004, 4, 1004, 'AB+', 1, DATE '2026-02-12', DATE '2026-04-28', 'Available');
INSERT INTO Blood_Unit VALUES (2005, 5, 1005, 'A-', 1, DATE '2026-02-20', DATE '2026-05-06', 'Available');
INSERT INTO Blood_Unit VALUES (2006, 6, 1006, 'O-', 1, DATE '2026-03-01', DATE '2026-05-15', 'Available');
INSERT INTO Blood_Unit VALUES (2007, 7, 1007, 'B-', 1, DATE '2026-03-08', DATE '2026-05-22', 'Available');
INSERT INTO Blood_Unit VALUES (2008, 8, 1008, 'AB-', 1, DATE '2026-03-15', DATE '2026-05-29', 'Available');
INSERT INTO Blood_Unit VALUES (2009, 9, 1009, 'A+', 1, DATE '2026-03-20', DATE '2026-06-03', 'Available');
INSERT INTO Blood_Unit VALUES (2010, 10, 1010, 'O+', 1, DATE '2026-03-25', DATE '2026-06-08', 'Available');

-- =========================
-- TABLE: Blood_Test
-- =========================
CREATE TABLE Blood_Test (
    test_id NUMBER PRIMARY KEY,
    unit_id NUMBER,
    result VARCHAR2(100),
    FOREIGN KEY (unit_id) REFERENCES Blood_Unit(unit_id)
);

INSERT INTO Blood_Test VALUES (3001, 2001, 'Negative');
INSERT INTO Blood_Test VALUES (3002, 2002, 'Negative');
INSERT INTO Blood_Test VALUES (3003, 2003, 'Negative');
INSERT INTO Blood_Test VALUES (3004, 2004, 'Negative');
INSERT INTO Blood_Test VALUES (3005, 2005, 'Negative');
INSERT INTO Blood_Test VALUES (3006, 2006, 'Negative');
INSERT INTO Blood_Test VALUES (3007, 2007, 'Negative');
INSERT INTO Blood_Test VALUES (3008, 2008, 'Negative');
INSERT INTO Blood_Test VALUES (3009, 2009, 'Negative');
INSERT INTO Blood_Test VALUES (3010, 2010, 'Negative');

-- =========================
-- TABLE: Staff
-- =========================
CREATE TABLE Staff (
    staff_id NUMBER PRIMARY KEY,
    staff_name VARCHAR2(100) NOT NULL,
    gender VARCHAR2(10),
    role VARCHAR2(50),
    email VARCHAR2(100),
    bank_id NUMBER,
    FOREIGN KEY (bank_id) REFERENCES Blood_Bank(bank_id)
);

INSERT INTO Staff VALUES (401, 'Rajesh Kumar', 'Male', 'Manager', 'rajesh@bloodbank.com', 1);
INSERT INTO Staff VALUES (402, 'Anita Sharma', 'Female', 'Nurse', 'anita@bloodbank.com', 2);
INSERT INTO Staff VALUES (403, 'Vivek Singh', 'Male', 'Technician', 'vivek@bloodbank.com', 3);
INSERT INTO Staff VALUES (404, 'Pallavi Gupta', 'Female', 'Doctor', 'pallavi@bloodbank.com', 4);
INSERT INTO Staff VALUES (405, 'Sanjay Verma', 'Male', 'Nurse', 'sanjay@bloodbank.com', 5);
INSERT INTO Staff VALUES (406, 'Ritu Mehta', 'Female', 'Technician', 'ritu@bloodbank.com', 6);
INSERT INTO Staff VALUES (407, 'Deepak Jain', 'Male', 'Manager', 'deepak@bloodbank.com', 7);
INSERT INTO Staff VALUES (408, 'Neha Kapoor', 'Female', 'Nurse', 'neha@bloodbank.com', 8);
INSERT INTO Staff VALUES (409, 'Mohit Agarwal', 'Male', 'Technician', 'mohit@bloodbank.com', 9);
INSERT INTO Staff VALUES (410, 'Swati Nair', 'Female', 'Doctor', 'swati@bloodbank.com', 10);

-- =========================
-- TABLE: Blood_Request
-- =========================
CREATE TABLE Blood_Request (
    recipient_id NUMBER,
    request_no NUMBER,
    request_date DATE,
    required_blood_group VARCHAR2(5),
    quantity NUMBER,
    urgency VARCHAR2(20),
    status VARCHAR2(30),
    PRIMARY KEY (recipient_id, request_no),
    FOREIGN KEY (recipient_id) REFERENCES Recipient(recipient_id)
);

INSERT INTO Blood_Request VALUES (101, 501, DATE '2026-04-01', 'A+', 1, 'High', 'Fulfilled');
INSERT INTO Blood_Request VALUES (102, 502, DATE '2026-04-02', 'B+', 1, 'Medium', 'Fulfilled');
INSERT INTO Blood_Request VALUES (103, 503, DATE '2026-04-03', 'O+', 2, 'High', 'Fulfilled');
INSERT INTO Blood_Request VALUES (104, 504, DATE '2026-04-04', 'AB+', 1, 'Low', 'Fulfilled');
INSERT INTO Blood_Request VALUES (105, 505, DATE '2026-04-05', 'A-', 1, 'Medium', 'Fulfilled');
INSERT INTO Blood_Request VALUES (106, 506, DATE '2026-04-06', 'O-', 1, 'High', 'Fulfilled');
INSERT INTO Blood_Request VALUES (107, 507, DATE '2026-04-07', 'B-', 1, 'Low', 'Fulfilled');
INSERT INTO Blood_Request VALUES (108, 508, DATE '2026-04-08', 'AB-', 1, 'Medium', 'Fulfilled');
INSERT INTO Blood_Request VALUES (109, 509, DATE '2026-04-09', 'A+', 1, 'High', 'Fulfilled');
INSERT INTO Blood_Request VALUES (110, 510, DATE '2026-04-10', 'O+', 1, 'Low', 'Fulfilled');

-- =========================
-- TABLE: Fulfilled_By
-- =========================
CREATE TABLE Fulfilled_By (
    recipient_id NUMBER,
    request_no NUMBER,
    unit_id NUMBER,
    PRIMARY KEY (recipient_id, request_no, unit_id),
    FOREIGN KEY (recipient_id, request_no)
        REFERENCES Blood_Request(recipient_id, request_no),
    FOREIGN KEY (unit_id) REFERENCES Blood_Unit(unit_id)
);

INSERT INTO Fulfilled_By VALUES (101, 501, 2001);
INSERT INTO Fulfilled_By VALUES (102, 502, 2002);
INSERT INTO Fulfilled_By VALUES (103, 503, 2003);
INSERT INTO Fulfilled_By VALUES (104, 504, 2004);
INSERT INTO Fulfilled_By VALUES (105, 505, 2005);
INSERT INTO Fulfilled_By VALUES (106, 506, 2006);
INSERT INTO Fulfilled_By VALUES (107, 507, 2007);
INSERT INTO Fulfilled_By VALUES (108, 508, 2008);
INSERT INTO Fulfilled_By VALUES (109, 509, 2009);
INSERT INTO Fulfilled_By VALUES (110, 510, 2010);

-- =========================
-- TABLE: Handled_By
-- =========================
CREATE TABLE Handled_By (
    recipient_id NUMBER,
    request_no NUMBER,
    staff_id NUMBER,
    PRIMARY KEY (recipient_id, request_no, staff_id),
    FOREIGN KEY (recipient_id, request_no)
        REFERENCES Blood_Request(recipient_id, request_no),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

INSERT INTO Handled_By VALUES (101, 501, 401);
INSERT INTO Handled_By VALUES (102, 502, 402);
INSERT INTO Handled_By VALUES (103, 503, 403);
INSERT INTO Handled_By VALUES (104, 504, 404);
INSERT INTO Handled_By VALUES (105, 505, 405);
INSERT INTO Handled_By VALUES (106, 506, 406);
INSERT INTO Handled_By VALUES (107, 507, 407);
INSERT INTO Handled_By VALUES (108, 508, 408);
INSERT INTO Handled_By VALUES (109, 509, 409);
INSERT INTO Handled_By VALUES (110, 510, 410);

COMMIT;

-- =========================
-- CHECK TABLES
-- =========================
SELECT table_name FROM user_tables ORDER BY table_name;
