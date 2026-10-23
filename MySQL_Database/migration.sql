-- ============================================================
--  AUTO-GENERATED: Oracle → MySQL Migration SQL
--  Generated: 2026-09-05T15:50:41.889Z
--  Source: BloodBankDB_Oracle.sql
--  Target: blood_bank_db (MySQL)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing dummy data
TRUNCATE TABLE blood_test;
TRUNCATE TABLE blood_request;
TRUNCATE TABLE donation_event;
TRUNCATE TABLE blood_unit;
TRUNCATE TABLE receiver;
TRUNCATE TABLE donor;
TRUNCATE TABLE staff_credentials;
TRUNCATE TABLE staff;
TRUNCATE TABLE blood_bank;

-- blood_bank (10 rows)
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (1, 'City Blood Bank', 'Sector 1, Delhi - 110001', 'Delhi', 'Delhi', '+91-110-110001000', 'city.bank@delhiblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (2, 'LifeCare Blood Bank', 'Sector 1, Mumbai - 400001', 'Mumbai', 'Maharashtra', '+91-400-400001000', 'lifecare.bank@mumbaiblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (3, 'Jaipur Blood Centre', 'Sector 1, Jaipur - 302001', 'Jaipur', 'Rajasthan', '+91-302-302001000', 'jaipur.centre@jaipurblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (4, 'Lucknow Blood Bank', 'Sector 1, Lucknow - 226001', 'Lucknow', 'Uttar Pradesh', '+91-226-226001000', 'lucknow.bank@lucknowblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (5, 'Pune Blood Centre', 'Sector 1, Pune - 411001', 'Pune', 'Maharashtra', '+91-411-411001000', 'pune.centre@puneblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (6, 'Chandigarh Blood Bank', 'Sector 1, Chandigarh - 160001', 'Chandigarh', 'Chandigarh', '+91-160-160001000', 'chandigarh.bank@chandigarhblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (7, 'Amritsar Blood Centre', 'Sector 1, Amritsar - 143001', 'Amritsar', 'Punjab', '+91-143-143001000', 'amritsar.centre@amritsarblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (8, 'Kanpur Blood Bank', 'Sector 1, Kanpur - 208001', 'Kanpur', 'Uttar Pradesh', '+91-208-208001000', 'kanpur.bank@kanpurblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (9, 'Bhopal Blood Centre', 'Sector 1, Bhopal - 462001', 'Bhopal', 'Madhya Pradesh', '+91-462-462001000', 'bhopal.centre@bhopalblood.org', 400, NULL);
INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (10, 'Ahmedabad Blood Bank', 'Sector 1, Ahmedabad - 380001', 'Ahmedabad', 'Gujarat', '+91-380-380001000', 'ahmedabad.bank@ahmedabadblood.org', 400, NULL);

-- staff (10 rows)
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (1, 1, 'Rajesh', 'Kumar', 'Admin', NULL, 'rajesh@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (2, 2, 'Anita', 'Sharma', 'Nurse', NULL, 'anita@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (3, 3, 'Vivek', 'Singh', 'Technician', NULL, 'vivek@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (4, 4, 'Pallavi', 'Gupta', 'Doctor', NULL, 'pallavi@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (5, 5, 'Sanjay', 'Verma', 'Nurse', NULL, 'sanjay@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (6, 6, 'Ritu', 'Mehta', 'Technician', NULL, 'ritu@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (7, 7, 'Deepak', 'Jain', 'Admin', NULL, 'deepak@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (8, 8, 'Neha', 'Kapoor', 'Nurse', NULL, 'neha@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (9, 9, 'Mohit', 'Agarwal', 'Technician', NULL, 'mohit@bloodbank.com', 'Morning', NULL);
INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (10, 10, 'Swati', 'Nair', 'Doctor', NULL, 'swati@bloodbank.com', 'Morning', NULL);

-- donor (10 rows)
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (1, 'Rahul', 'Sharma', '2000-05-12', 'Male', 'A+', '+91-9876543210', 'rahul.sharma@gmail.com', 'Main Road', 'Delhi', 'Delhi', 1, '2026-01-10', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (2, 'Priya', 'Singh', '1999-08-21', 'Female', 'B+', '+91-9876543211', 'priya.singh@gmail.com', 'Main Road', 'Mumbai', 'Maharashtra', 1, '2026-01-15', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (3, 'Amit', 'Kumar', '2001-02-15', 'Male', 'O+', '+91-9876543212', 'amit.kumar@gmail.com', 'Main Road', 'Jaipur', 'Rajasthan', 1, '2026-02-05', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (4, 'Neha', 'Verma', '1998-11-30', 'Female', 'AB+', '+91-9876543213', 'neha.verma@gmail.com', 'Main Road', 'Lucknow', 'Uttar Pradesh', 1, '2026-02-12', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (5, 'Rohit', 'Gupta', '2000-07-19', 'Male', 'A-', '+91-9876543214', 'rohit.gupta@gmail.com', 'Main Road', 'Delhi', 'Delhi', 1, '2026-02-20', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (6, 'Anjali', 'Mehta', '2002-01-10', 'Female', 'O-', '+91-9876543215', 'anjali.mehta@gmail.com', 'Main Road', 'Pune', 'Maharashtra', 1, '2026-03-01', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (7, 'Karan', 'Malhotra', '1997-09-25', 'Male', 'B-', '+91-9876543216', 'karan.malhotra@gmail.com', 'Main Road', 'Chandigarh', 'Chandigarh', 1, '2026-03-08', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (8, 'Simran', 'Kaur', '2001-12-05', 'Female', 'AB-', '+91-9876543217', 'simran.kaur@gmail.com', 'Main Road', 'Amritsar', 'Punjab', 1, '2026-03-15', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (9, 'Vikas', 'Yadav', '1999-04-18', 'Male', 'A+', '+91-9876543218', 'vikas.yadav@gmail.com', 'Main Road', 'Kanpur', 'Uttar Pradesh', 1, '2026-03-20', 1);
INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (10, 'Pooja', 'Sharma', '2000-06-22', 'Female', 'O+', '+91-9876543219', 'pooja.sharma@gmail.com', 'Main Road', 'Bhopal', 'Madhya Pradesh', 1, '2026-03-25', 1);

-- receiver (10 rows)
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (1, 'Arjun', 'Mehta', '2001-01-15', 'Male', 'A+', '+91-9123456780', 'arjun.mehta@gmail.com', NULL, 'Delhi', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (2, 'Sneha', 'Kapoor', '1994-01-15', 'Female', 'B+', '+91-9123456781', 'sneha.kapoor@gmail.com', NULL, 'Mumbai', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (3, 'Ravi', 'Patel', '1981-01-15', 'Male', 'O+', '+91-9123456782', 'ravi.patel@gmail.com', NULL, 'Ahmedabad', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (4, 'Kavya', 'Nair', '1998-01-15', 'Female', 'AB+', '+91-9123456783', 'kavya.nair@gmail.com', NULL, 'Kochi', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (5, 'Manish', 'Jain', '1975-01-15', 'Male', 'A-', '+91-9123456784', 'manish.jain@gmail.com', NULL, 'Jaipur', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (6, 'Isha', 'Sharma', '2004-01-15', 'Female', 'O-', '+91-9123456785', 'isha.sharma@gmail.com', NULL, 'Pune', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (7, 'Suresh', 'Kumar', '1966-01-15', 'Male', 'B-', '+91-9123456786', 'suresh.kumar@gmail.com', NULL, 'Chandigarh', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (8, 'Meera', 'Singh', '1991-01-15', 'Female', 'AB-', '+91-9123456787', 'meera.singh@gmail.com', NULL, 'Amritsar', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (9, 'Aditya', 'Verma', '1986-01-15', 'Male', 'A+', '+91-9123456788', 'aditya.verma@gmail.com', NULL, 'Lucknow', NULL);
INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (10, 'Nisha', 'Gupta', '1997-01-15', 'Female', 'O+', '+91-9123456789', 'nisha.gupta@gmail.com', NULL, 'Bhopal', NULL);

-- blood_unit (10 rows)
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (1, 1, 'BU-001', 'A+', 450, '2026-01-10', '2026-03-21', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (2, 2, 'BU-002', 'B+', 450, '2026-01-15', '2026-03-26', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (3, 3, 'BU-003', 'O+', 450, '2026-02-05', '2026-04-21', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (4, 4, 'BU-004', 'AB+', 450, '2026-02-12', '2026-04-28', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (5, 1, 'BU-005', 'A-', 450, '2026-02-20', '2026-05-06', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (6, 5, 'BU-006', 'O-', 450, '2026-03-01', '2026-05-15', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (7, 6, 'BU-007', 'B-', 450, '2026-03-08', '2026-05-22', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (8, 7, 'BU-008', 'AB-', 450, '2026-03-15', '2026-05-29', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (9, 8, 'BU-009', 'A+', 450, '2026-03-20', '2026-06-03', 'Available', 4);
INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (10, 9, 'BU-010', 'O+', 450, '2026-03-25', '2026-06-08', 'Available', 4);

-- donation_event (10 rows)
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (1, 1, 1, 1, '2026-01-10', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (2, 2, 2, 2, '2026-01-15', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (3, 3, 3, 3, '2026-02-05', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (4, 4, 4, 4, '2026-02-12', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (5, 5, 1, 5, '2026-02-20', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (6, 6, 5, 6, '2026-03-01', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (7, 7, 6, 7, '2026-03-08', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (8, 8, 7, 8, '2026-03-15', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (9, 9, 8, 9, '2026-03-20', NULL, NULL, NULL);
INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (10, 10, 9, 10, '2026-03-25', NULL, NULL, NULL);

-- blood_test (10 rows)
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (1, 1, 1, 'HIV', '2026-01-10', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (2, 2, 2, 'HIV', '2026-01-15', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (3, 3, 3, 'HIV', '2026-02-05', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (4, 4, 4, 'HIV', '2026-02-12', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (5, 5, 5, 'HIV', '2026-02-20', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (6, 6, 6, 'HIV', '2026-03-01', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (7, 7, 7, 'HIV', '2026-03-08', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (8, 8, 8, 'HIV', '2026-03-15', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (9, 9, 9, 'HIV', '2026-03-20', 'Negative', NULL, 'Imported from Oracle database');
INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (10, 10, 10, 'HIV', '2026-03-25', 'Negative', NULL, 'Imported from Oracle database');

-- blood_request (10 rows)
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (1, 1, 1, 1, 'A+', 450, 'Critical', '2026-04-01', NULL, 'Fulfilled', 1, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (2, 2, 2, 2, 'B+', 450, 'Urgent', '2026-04-02', NULL, 'Fulfilled', 2, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (3, 3, 3, 3, 'O+', 900, 'Critical', '2026-04-03', NULL, 'Fulfilled', 3, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (4, 4, 4, 4, 'AB+', 450, 'Normal', '2026-04-04', NULL, 'Fulfilled', 4, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (5, 5, 1, 5, 'A-', 450, 'Urgent', '2026-04-05', NULL, 'Fulfilled', 5, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (6, 6, 5, 6, 'O-', 450, 'Critical', '2026-04-06', NULL, 'Fulfilled', 6, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (7, 7, 6, 7, 'B-', 450, 'Normal', '2026-04-07', NULL, 'Fulfilled', 7, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (8, 8, 7, 8, 'AB-', 450, 'Urgent', '2026-04-08', NULL, 'Fulfilled', 8, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (9, 9, 8, 9, 'A+', 450, 'Critical', '2026-04-09', NULL, 'Fulfilled', 9, NULL);
INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (10, 10, 9, 10, 'O+', 450, 'Normal', '2026-04-10', NULL, 'Fulfilled', 10, NULL);

SET FOREIGN_KEY_CHECKS = 1;

-- Re-seed staff_credentials (run seedAuth.js after this)
-- Or manually insert:
-- INSERT INTO staff_credentials (staff_id, password_hash)
-- SELECT staff_id, '$2b$10$...' FROM staff;
