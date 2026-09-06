#!/usr/bin/env node
/**
 * ============================================================
 *  Oracle → MySQL Migration Script
 *  Blood Bank Management System
 * ============================================================
 *
 *  Transforms data from BloodBankDB_Oracle.sql (normalized
 *  academic model with composite PKs, junction tables, single
 *  name fields) into our MySQL application schema (surrogate
 *  AUTO_INCREMENT PKs, ENUMs, split first/last names).
 *
 *  Usage:
 *    node migrateOracleData.js --dry-run     Validate only (default)
 *    node migrateOracleData.js --generate    Write migration.sql file
 *    node migrateOracleData.js --execute     Run migration against MySQL
 *
 *  SAFETY: --execute will TRUNCATE dummy data. Back up first!
 * ============================================================
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');

// --------------- MODE ---------------
const args = process.argv.slice(2);
const MODE = args.includes('--execute') ? 'execute'
           : args.includes('--generate') ? 'generate'
           : 'dry-run';

console.log(`\n${'='.repeat(60)}`);
console.log(`  BLOOD BANK — Oracle → MySQL Migration`);
console.log(`  Mode: ${MODE.toUpperCase()}`);
console.log(`${'='.repeat(60)}\n`);

// ===================================================================
//  SECTION 1 — RAW ORACLE DATA  (parsed from BloodBankDB_Oracle.sql)
// ===================================================================

const cityToState = {
  'Delhi': 'Delhi',
  'Mumbai': 'Maharashtra',
  'Jaipur': 'Rajasthan',
  'Lucknow': 'Uttar Pradesh',
  'Pune': 'Maharashtra',
  'Chandigarh': 'Chandigarh',
  'Amritsar': 'Punjab',
  'Kanpur': 'Uttar Pradesh',
  'Bhopal': 'Madhya Pradesh',
  'Ahmedabad': 'Gujarat',
  'Kochi': 'Kerala',
};

// --- Oracle: Donor ---
const oracleDonors = [
  { donor_id: 1,  donor_name: 'Rahul Sharma',    gender: 'Male',   blood_group: 'A+',  address: 'Delhi',      dob: '2000-05-12' },
  { donor_id: 2,  donor_name: 'Priya Singh',      gender: 'Female', blood_group: 'B+',  address: 'Mumbai',     dob: '1999-08-21' },
  { donor_id: 3,  donor_name: 'Amit Kumar',        gender: 'Male',   blood_group: 'O+',  address: 'Jaipur',     dob: '2001-02-15' },
  { donor_id: 4,  donor_name: 'Neha Verma',        gender: 'Female', blood_group: 'AB+', address: 'Lucknow',    dob: '1998-11-30' },
  { donor_id: 5,  donor_name: 'Rohit Gupta',       gender: 'Male',   blood_group: 'A-',  address: 'Delhi',      dob: '2000-07-19' },
  { donor_id: 6,  donor_name: 'Anjali Mehta',      gender: 'Female', blood_group: 'O-',  address: 'Pune',       dob: '2002-01-10' },
  { donor_id: 7,  donor_name: 'Karan Malhotra',    gender: 'Male',   blood_group: 'B-',  address: 'Chandigarh', dob: '1997-09-25' },
  { donor_id: 8,  donor_name: 'Simran Kaur',       gender: 'Female', blood_group: 'AB-', address: 'Amritsar',   dob: '2001-12-05' },
  { donor_id: 9,  donor_name: 'Vikas Yadav',       gender: 'Male',   blood_group: 'A+',  address: 'Kanpur',     dob: '1999-04-18' },
  { donor_id: 10, donor_name: 'Pooja Sharma',      gender: 'Female', blood_group: 'O+',  address: 'Bhopal',     dob: '2000-06-22' },
];

// --- Oracle: Donor_Phone ---
const oracleDonorPhones = {
  1: '9876543210', 2: '9876543211', 3: '9876543212', 4: '9876543213',
  5: '9876543214', 6: '9876543215', 7: '9876543216', 8: '9876543217',
  9: '9876543218', 10: '9876543219',
};

// --- Oracle: Recipient ---
const oracleRecipients = [
  { recipient_id: 101, recipient_name: 'Arjun Mehta',   age: 25, blood_group: 'A+',  address: 'Delhi',      gender: 'Male'   },
  { recipient_id: 102, recipient_name: 'Sneha Kapoor',  age: 32, blood_group: 'B+',  address: 'Mumbai',     gender: 'Female' },
  { recipient_id: 103, recipient_name: 'Ravi Patel',    age: 45, blood_group: 'O+',  address: 'Ahmedabad',  gender: 'Male'   },
  { recipient_id: 104, recipient_name: 'Kavya Nair',    age: 28, blood_group: 'AB+', address: 'Kochi',      gender: 'Female' },
  { recipient_id: 105, recipient_name: 'Manish Jain',   age: 51, blood_group: 'A-',  address: 'Jaipur',     gender: 'Male'   },
  { recipient_id: 106, recipient_name: 'Isha Sharma',   age: 22, blood_group: 'O-',  address: 'Pune',       gender: 'Female' },
  { recipient_id: 107, recipient_name: 'Suresh Kumar',  age: 60, blood_group: 'B-',  address: 'Chandigarh', gender: 'Male'   },
  { recipient_id: 108, recipient_name: 'Meera Singh',   age: 35, blood_group: 'AB-', address: 'Amritsar',   gender: 'Female' },
  { recipient_id: 109, recipient_name: 'Aditya Verma',  age: 40, blood_group: 'A+',  address: 'Lucknow',    gender: 'Male'   },
  { recipient_id: 110, recipient_name: 'Nisha Gupta',   age: 29, blood_group: 'O+',  address: 'Bhopal',     gender: 'Female' },
];

// --- Oracle: Recipient_Phone ---
const oracleRecipientPhones = {
  101: '9123456780', 102: '9123456781', 103: '9123456782', 104: '9123456783',
  105: '9123456784', 106: '9123456785', 107: '9123456786', 108: '9123456787',
  109: '9123456788', 110: '9123456789',
};

// --- Oracle: Blood_Bank ---
const oracleBanks = [
  { bank_id: 1,  bank_name: 'City Blood Bank',        city: 'Delhi',      state: 'Delhi',           pincode: '110001' },
  { bank_id: 2,  bank_name: 'LifeCare Blood Bank',    city: 'Mumbai',     state: 'Maharashtra',     pincode: '400001' },
  { bank_id: 3,  bank_name: 'Jaipur Blood Centre',    city: 'Jaipur',     state: 'Rajasthan',       pincode: '302001' },
  { bank_id: 4,  bank_name: 'Lucknow Blood Bank',     city: 'Lucknow',    state: 'Uttar Pradesh',   pincode: '226001' },
  { bank_id: 5,  bank_name: 'Pune Blood Centre',      city: 'Pune',       state: 'Maharashtra',     pincode: '411001' },
  { bank_id: 6,  bank_name: 'Chandigarh Blood Bank',  city: 'Chandigarh', state: 'Chandigarh',      pincode: '160001' },
  { bank_id: 7,  bank_name: 'Amritsar Blood Centre',  city: 'Amritsar',   state: 'Punjab',          pincode: '143001' },
  { bank_id: 8,  bank_name: 'Kanpur Blood Bank',      city: 'Kanpur',     state: 'Uttar Pradesh',   pincode: '208001' },
  { bank_id: 9,  bank_name: 'Bhopal Blood Centre',    city: 'Bhopal',     state: 'Madhya Pradesh',  pincode: '462001' },
  { bank_id: 10, bank_name: 'Ahmedabad Blood Bank',   city: 'Ahmedabad',  state: 'Gujarat',         pincode: '380001' },
];

// --- Oracle: Donation (composite PK) ---
const oracleDonations = [
  { donor_id: 1,  donation_no: 1001, donation_date: '2026-01-10', bank_id: 1 },
  { donor_id: 2,  donation_no: 1002, donation_date: '2026-01-15', bank_id: 2 },
  { donor_id: 3,  donation_no: 1003, donation_date: '2026-02-05', bank_id: 3 },
  { donor_id: 4,  donation_no: 1004, donation_date: '2026-02-12', bank_id: 4 },
  { donor_id: 5,  donation_no: 1005, donation_date: '2026-02-20', bank_id: 1 },
  { donor_id: 6,  donation_no: 1006, donation_date: '2026-03-01', bank_id: 5 },
  { donor_id: 7,  donation_no: 1007, donation_date: '2026-03-08', bank_id: 6 },
  { donor_id: 8,  donation_no: 1008, donation_date: '2026-03-15', bank_id: 7 },
  { donor_id: 9,  donation_no: 1009, donation_date: '2026-03-20', bank_id: 8 },
  { donor_id: 10, donation_no: 1010, donation_date: '2026-03-25', bank_id: 9 },
];

// --- Oracle: Blood_Unit ---
const oracleUnits = [
  { unit_id: 2001, donor_id: 1,  donation_no: 1001, blood_group: 'A+',  quantity: 1, collection_date: '2026-01-10', expiry_date: '2026-03-21', status: 'Available' },
  { unit_id: 2002, donor_id: 2,  donation_no: 1002, blood_group: 'B+',  quantity: 1, collection_date: '2026-01-15', expiry_date: '2026-03-26', status: 'Available' },
  { unit_id: 2003, donor_id: 3,  donation_no: 1003, blood_group: 'O+',  quantity: 1, collection_date: '2026-02-05', expiry_date: '2026-04-21', status: 'Available' },
  { unit_id: 2004, donor_id: 4,  donation_no: 1004, blood_group: 'AB+', quantity: 1, collection_date: '2026-02-12', expiry_date: '2026-04-28', status: 'Available' },
  { unit_id: 2005, donor_id: 5,  donation_no: 1005, blood_group: 'A-',  quantity: 1, collection_date: '2026-02-20', expiry_date: '2026-05-06', status: 'Available' },
  { unit_id: 2006, donor_id: 6,  donation_no: 1006, blood_group: 'O-',  quantity: 1, collection_date: '2026-03-01', expiry_date: '2026-05-15', status: 'Available' },
  { unit_id: 2007, donor_id: 7,  donation_no: 1007, blood_group: 'B-',  quantity: 1, collection_date: '2026-03-08', expiry_date: '2026-05-22', status: 'Available' },
  { unit_id: 2008, donor_id: 8,  donation_no: 1008, blood_group: 'AB-', quantity: 1, collection_date: '2026-03-15', expiry_date: '2026-05-29', status: 'Available' },
  { unit_id: 2009, donor_id: 9,  donation_no: 1009, blood_group: 'A+',  quantity: 1, collection_date: '2026-03-20', expiry_date: '2026-06-03', status: 'Available' },
  { unit_id: 2010, donor_id: 10, donation_no: 1010, blood_group: 'O+',  quantity: 1, collection_date: '2026-03-25', expiry_date: '2026-06-08', status: 'Available' },
];

// --- Oracle: Blood_Test ---
const oracleTests = [
  { test_id: 3001, unit_id: 2001, result: 'Negative' },
  { test_id: 3002, unit_id: 2002, result: 'Negative' },
  { test_id: 3003, unit_id: 2003, result: 'Negative' },
  { test_id: 3004, unit_id: 2004, result: 'Negative' },
  { test_id: 3005, unit_id: 2005, result: 'Negative' },
  { test_id: 3006, unit_id: 2006, result: 'Negative' },
  { test_id: 3007, unit_id: 2007, result: 'Negative' },
  { test_id: 3008, unit_id: 2008, result: 'Negative' },
  { test_id: 3009, unit_id: 2009, result: 'Negative' },
  { test_id: 3010, unit_id: 2010, result: 'Negative' },
];

// --- Oracle: Staff ---
const oracleStaff = [
  { staff_id: 401, staff_name: 'Rajesh Kumar',    gender: 'Male',   role: 'Manager',    email: 'rajesh@bloodbank.com',  bank_id: 1  },
  { staff_id: 402, staff_name: 'Anita Sharma',    gender: 'Female', role: 'Nurse',       email: 'anita@bloodbank.com',   bank_id: 2  },
  { staff_id: 403, staff_name: 'Vivek Singh',     gender: 'Male',   role: 'Technician',  email: 'vivek@bloodbank.com',   bank_id: 3  },
  { staff_id: 404, staff_name: 'Pallavi Gupta',   gender: 'Female', role: 'Doctor',      email: 'pallavi@bloodbank.com', bank_id: 4  },
  { staff_id: 405, staff_name: 'Sanjay Verma',    gender: 'Male',   role: 'Nurse',       email: 'sanjay@bloodbank.com',  bank_id: 5  },
  { staff_id: 406, staff_name: 'Ritu Mehta',      gender: 'Female', role: 'Technician',  email: 'ritu@bloodbank.com',    bank_id: 6  },
  { staff_id: 407, staff_name: 'Deepak Jain',     gender: 'Male',   role: 'Manager',     email: 'deepak@bloodbank.com',  bank_id: 7  },
  { staff_id: 408, staff_name: 'Neha Kapoor',     gender: 'Female', role: 'Nurse',       email: 'neha@bloodbank.com',    bank_id: 8  },
  { staff_id: 409, staff_name: 'Mohit Agarwal',   gender: 'Male',   role: 'Technician',  email: 'mohit@bloodbank.com',   bank_id: 9  },
  { staff_id: 410, staff_name: 'Swati Nair',      gender: 'Female', role: 'Doctor',      email: 'swati@bloodbank.com',   bank_id: 10 },
];

// --- Oracle: Blood_Request (composite PK) ---
const oracleRequests = [
  { recipient_id: 101, request_no: 501, request_date: '2026-04-01', required_blood_group: 'A+',  quantity: 1, urgency: 'High',   status: 'Fulfilled' },
  { recipient_id: 102, request_no: 502, request_date: '2026-04-02', required_blood_group: 'B+',  quantity: 1, urgency: 'Medium', status: 'Fulfilled' },
  { recipient_id: 103, request_no: 503, request_date: '2026-04-03', required_blood_group: 'O+',  quantity: 2, urgency: 'High',   status: 'Fulfilled' },
  { recipient_id: 104, request_no: 504, request_date: '2026-04-04', required_blood_group: 'AB+', quantity: 1, urgency: 'Low',    status: 'Fulfilled' },
  { recipient_id: 105, request_no: 505, request_date: '2026-04-05', required_blood_group: 'A-',  quantity: 1, urgency: 'Medium', status: 'Fulfilled' },
  { recipient_id: 106, request_no: 506, request_date: '2026-04-06', required_blood_group: 'O-',  quantity: 1, urgency: 'High',   status: 'Fulfilled' },
  { recipient_id: 107, request_no: 507, request_date: '2026-04-07', required_blood_group: 'B-',  quantity: 1, urgency: 'Low',    status: 'Fulfilled' },
  { recipient_id: 108, request_no: 508, request_date: '2026-04-08', required_blood_group: 'AB-', quantity: 1, urgency: 'Medium', status: 'Fulfilled' },
  { recipient_id: 109, request_no: 509, request_date: '2026-04-09', required_blood_group: 'A+',  quantity: 1, urgency: 'High',   status: 'Fulfilled' },
  { recipient_id: 110, request_no: 510, request_date: '2026-04-10', required_blood_group: 'O+',  quantity: 1, urgency: 'Low',    status: 'Fulfilled' },
];

// --- Oracle: Fulfilled_By (junction) ---
const oracleFulfilledBy = [
  { recipient_id: 101, request_no: 501, unit_id: 2001 },
  { recipient_id: 102, request_no: 502, unit_id: 2002 },
  { recipient_id: 103, request_no: 503, unit_id: 2003 },
  { recipient_id: 104, request_no: 504, unit_id: 2004 },
  { recipient_id: 105, request_no: 505, unit_id: 2005 },
  { recipient_id: 106, request_no: 506, unit_id: 2006 },
  { recipient_id: 107, request_no: 507, unit_id: 2007 },
  { recipient_id: 108, request_no: 508, unit_id: 2008 },
  { recipient_id: 109, request_no: 509, unit_id: 2009 },
  { recipient_id: 110, request_no: 510, unit_id: 2010 },
];

// --- Oracle: Handled_By (junction) ---
const oracleHandledBy = [
  { recipient_id: 101, request_no: 501, staff_id: 401 },
  { recipient_id: 102, request_no: 502, staff_id: 402 },
  { recipient_id: 103, request_no: 503, staff_id: 403 },
  { recipient_id: 104, request_no: 504, staff_id: 404 },
  { recipient_id: 105, request_no: 505, staff_id: 405 },
  { recipient_id: 106, request_no: 506, staff_id: 406 },
  { recipient_id: 107, request_no: 507, staff_id: 407 },
  { recipient_id: 108, request_no: 508, staff_id: 408 },
  { recipient_id: 109, request_no: 509, staff_id: 409 },
  { recipient_id: 110, request_no: 510, staff_id: 410 },
];


// ===================================================================
//  SECTION 2 — ID REMAPPING
// ===================================================================

// donor_id: 1-10 → 1-10 (no change needed)
// bank_id:  1-10 → 1-10 (no change needed)
// staff_id: 401-410 → 1-10
const staffIdMap = {};
oracleStaff.forEach((s, i) => { staffIdMap[s.staff_id] = i + 1; });

// receiver_id: 101-110 → 1-10
const receiverIdMap = {};
oracleRecipients.forEach((r, i) => { receiverIdMap[r.recipient_id] = i + 1; });

// unit_id: 2001-2010 → 1-10
const unitIdMap = {};
oracleUnits.forEach((u, i) => { unitIdMap[u.unit_id] = i + 1; });

// donation composite PK → event_id: 1-10
const donationToEventMap = {};  // "donor_id:donation_no" → event_id
oracleDonations.forEach((d, i) => {
  donationToEventMap[`${d.donor_id}:${d.donation_no}`] = i + 1;
});

// request composite PK → request_id: 1-10
const requestIdMap = {};  // "recipient_id:request_no" → request_id
oracleRequests.forEach((r, i) => {
  requestIdMap[`${r.recipient_id}:${r.request_no}`] = i + 1;
});

// test_id: 3001-3010 → 1-10
const testIdMap = {};
oracleTests.forEach((t, i) => { testIdMap[t.test_id] = i + 1; });


// ===================================================================
//  SECTION 3 — TRANSFORMATIONS
// ===================================================================

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  const last = parts.pop();
  return { first_name: parts.join(' '), last_name: last };
}

function dobFromAge(age) {
  // Approximate: subtract age from reference date 2026-09-05
  const year = 2026 - age;
  return `${year}-01-15`; // Use Jan 15 as approximate birthday
}

function mapUrgency(oracle) {
  const map = { 'High': 'Critical', 'Medium': 'Urgent', 'Low': 'Normal' };
  return map[oracle] || 'Normal';
}

function mapRole(oracle) {
  const map = { 'Manager': 'Admin', 'Doctor': 'Doctor', 'Nurse': 'Nurse', 'Technician': 'Technician' };
  return map[oracle] || 'Admin';
}

function generateEmail(name, domain) {
  const parts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
}

// ---- 3a. Transform blood_bank ----
console.log('🏥 Transforming blood_bank...');
const mysqlBanks = oracleBanks.map(b => ({
  bank_id:     b.bank_id,
  name:        b.bank_name,
  address:     `Sector 1, ${b.city} - ${b.pincode}`,
  city:        b.city,
  state:       b.state,
  phone:       `+91-${b.pincode.slice(0, 3)}-${b.pincode}000`,
  email:       generateEmail(b.bank_name, `${b.city.toLowerCase().replace(/\s/g, '')}blood.org`),
  capacity:    400,
  established: null,
}));
console.log(`   ✓ ${mysqlBanks.length} blood banks transformed`);

// ---- 3b. Transform staff ----
console.log('👥 Transforming staff...');
const mysqlStaff = oracleStaff.map(s => {
  const { first_name, last_name } = splitName(s.staff_name);
  return {
    staff_id:   staffIdMap[s.staff_id],
    bank_id:    s.bank_id,
    first_name,
    last_name,
    role:       mapRole(s.role),
    phone:      null,
    email:      s.email,
    shift:      'Morning',
    hired_date: null,
  };
});
console.log(`   ✓ ${mysqlStaff.length} staff members transformed`);
console.log(`   ⚠ Mapped role: "Manager" → "Admin" (2 staff members)`);

// ---- 3c. Transform donor ----
console.log('🩸 Transforming donor...');
// Build donation counts per donor
const donorDonationCount = {};
const donorLastDonation = {};
oracleDonations.forEach(d => {
  donorDonationCount[d.donor_id] = (donorDonationCount[d.donor_id] || 0) + 1;
  if (!donorLastDonation[d.donor_id] || d.donation_date > donorLastDonation[d.donor_id]) {
    donorLastDonation[d.donor_id] = d.donation_date;
  }
});

const mysqlDonors = oracleDonors.map(d => {
  const { first_name, last_name } = splitName(d.donor_name);
  const phone = oracleDonorPhones[d.donor_id] ? `+91-${oracleDonorPhones[d.donor_id]}` : null;
  return {
    donor_id:        d.donor_id,
    first_name,
    last_name,
    dob:             d.dob,
    gender:          d.gender,
    blood_group:     d.blood_group,
    phone:           phone,
    email:           generateEmail(d.donor_name, 'gmail.com'),
    street:          `Main Road`,
    city:            d.address,        // Oracle "address" is just the city
    state:           cityToState[d.address] || d.address,
    total_donations: donorDonationCount[d.donor_id] || 0,
    last_donation:   donorLastDonation[d.donor_id] || null,
    is_eligible:     1,
  };
});
console.log(`   ✓ ${mysqlDonors.length} donors transformed`);
console.log(`   ⚠ Split donor_name → first_name + last_name`);
console.log(`   ⚠ Flattened Donor_Phone → donor.phone`);
console.log(`   ⚠ Derived total_donations and last_donation from Donation table`);

// ---- 3d. Transform receiver ----
console.log('🏨 Transforming receiver...');
const mysqlReceivers = oracleRecipients.map(r => {
  const { first_name, last_name } = splitName(r.recipient_name);
  const phone = oracleRecipientPhones[r.recipient_id] ? `+91-${oracleRecipientPhones[r.recipient_id]}` : null;
  return {
    receiver_id:      receiverIdMap[r.recipient_id],
    first_name,
    last_name,
    dob:              dobFromAge(r.age),
    gender:           r.gender,
    blood_group:      r.blood_group,
    phone:            phone,
    email:            generateEmail(r.recipient_name, 'gmail.com'),
    hospital_name:    null,
    hospital_city:    r.address,  // Oracle address is city — use as hospital_city
    medical_condition: null,
  };
});
console.log(`   ✓ ${mysqlReceivers.length} receivers transformed`);
console.log(`   ⚠ Split recipient_name → first_name + last_name`);
console.log(`   ⚠ Derived dob from age (approximate: Jan 15 of birth year)`);
console.log(`   ⚠ Flattened Recipient_Phone → receiver.phone`);
console.log(`   ⚠ Used Oracle address as hospital_city`);

// ---- 3e. Transform blood_unit ----
console.log('🧪 Transforming blood_unit...');
// Derive bank_id from Blood_Unit → Donation → bank_id
const donationBankMap = {};  // "donor_id:donation_no" → bank_id
oracleDonations.forEach(d => {
  donationBankMap[`${d.donor_id}:${d.donation_no}`] = d.bank_id;
});

const mysqlUnits = oracleUnits.map((u, i) => ({
  unit_id:        unitIdMap[u.unit_id],
  bank_id:        donationBankMap[`${u.donor_id}:${u.donation_no}`],
  unit_code:      `BU-${String(i + 1).padStart(3, '0')}`,
  blood_group:    u.blood_group,
  volume_ml:      450,
  collected_date: u.collection_date,
  expiry_date:    u.expiry_date,
  status:         u.status,
  storage_temp:   4.0,
}));
console.log(`   ✓ ${mysqlUnits.length} blood units transformed`);
console.log(`   ⚠ Derived bank_id via Donation FK chain`);
console.log(`   ⚠ Generated unit_code (BU-001 .. BU-010)`);
console.log(`   ⚠ Set volume_ml=450, storage_temp=4.0`);

// ---- 3f. Transform donation_event ----
console.log('📋 Transforming donation_event...');
// Map each donation to its produced blood_unit
const donationToUnit = {};  // "donor_id:donation_no" → new unit_id
oracleUnits.forEach(u => {
  donationToUnit[`${u.donor_id}:${u.donation_no}`] = unitIdMap[u.unit_id];
});

const mysqlEvents = oracleDonations.map(d => ({
  event_id:   donationToEventMap[`${d.donor_id}:${d.donation_no}`],
  donor_id:   d.donor_id,
  bank_id:    d.bank_id,
  unit_id:    donationToUnit[`${d.donor_id}:${d.donation_no}`] || null,
  event_date: d.donation_date,
  event_time: null,
  staff_id:   null,
  notes:      null,
}));
console.log(`   ✓ ${mysqlEvents.length} donation events transformed`);
console.log(`   ⚠ Composite PK (donor_id, donation_no) → surrogate event_id`);
console.log(`   ⚠ Linked unit_id from Blood_Unit records`);

// ---- 3g. Transform blood_test ----
console.log('🔬 Transforming blood_test...');
// Derive event_id and donor_id from unit_id → blood_unit → donation
const unitToDonation = {};  // oracle unit_id → { donor_id, donation_no }
oracleUnits.forEach(u => {
  unitToDonation[u.unit_id] = { donor_id: u.donor_id, donation_no: u.donation_no, collection_date: u.collection_date };
});

const mysqlTests = oracleTests.map(t => {
  const donation = unitToDonation[t.unit_id];
  const eventId = donationToEventMap[`${donation.donor_id}:${donation.donation_no}`];
  return {
    test_id:     testIdMap[t.test_id],
    event_id:    eventId,
    donor_id:    donation.donor_id,
    test_type:   'HIV',              // Oracle has no test_type — default to HIV
    tested_date: donation.collection_date,  // Use collection date
    result:      t.result,            // 'Negative' — matches our ENUM
    tested_by:   null,
    remarks:     'Imported from Oracle database',
  };
});
console.log(`   ✓ ${mysqlTests.length} blood tests transformed`);
console.log(`   ⚠ Derived event_id and donor_id via Blood_Unit → Donation chain`);
console.log(`   ⚠ Set test_type='HIV' (Oracle has no test type field)`);
console.log(`   ⚠ Used collection_date as tested_date`);

// ---- 3h. Transform blood_request ----
console.log('📝 Transforming blood_request...');
// Build lookup for fulfilled_by and handled_by
const fulfilledByMap = {};  // "recipient_id:request_no" → oracle unit_id
oracleFulfilledBy.forEach(f => {
  fulfilledByMap[`${f.recipient_id}:${f.request_no}`] = f.unit_id;
});
const handledByMap = {};  // "recipient_id:request_no" → oracle staff_id
oracleHandledBy.forEach(h => {
  handledByMap[`${h.recipient_id}:${h.request_no}`] = h.staff_id;
});

// Derive bank_id from fulfilled unit → donation → bank
const unitToBankMap = {};
oracleUnits.forEach(u => {
  unitToBankMap[u.unit_id] = donationBankMap[`${u.donor_id}:${u.donation_no}`];
});

const mysqlRequests = oracleRequests.map(r => {
  const key = `${r.recipient_id}:${r.request_no}`;
  const oracleUnitId = fulfilledByMap[key];
  const oracleStaffId = handledByMap[key];
  return {
    request_id:  requestIdMap[key],
    receiver_id: receiverIdMap[r.recipient_id],
    bank_id:     unitToBankMap[oracleUnitId] || 1,
    unit_id:     oracleUnitId ? unitIdMap[oracleUnitId] : null,
    blood_group: r.required_blood_group,
    quantity_ml: r.quantity * 450,
    urgency:     mapUrgency(r.urgency),
    request_date: r.request_date,
    required_by: null,
    status:      r.status,    // 'Fulfilled' — matches our ENUM
    handled_by:  oracleStaffId ? staffIdMap[oracleStaffId] : null,
    notes:       null,
  };
});
console.log(`   ✓ ${mysqlRequests.length} blood requests transformed`);
console.log(`   ⚠ Composite PK → surrogate request_id`);
console.log(`   ⚠ Collapsed Fulfilled_By → blood_request.unit_id`);
console.log(`   ⚠ Collapsed Handled_By → blood_request.handled_by`);
console.log(`   ⚠ Mapped urgency: High→Critical, Medium→Urgent, Low→Normal`);
console.log(`   ⚠ Derived bank_id via Fulfilled_By → Blood_Unit → Donation`);
console.log(`   ⚠ quantity × 450 → quantity_ml`);


// ===================================================================
//  SECTION 4 — VALIDATION
// ===================================================================
console.log(`\n${'─'.repeat(60)}`);
console.log('  VALIDATION');
console.log(`${'─'.repeat(60)}\n`);

let errors = 0;
let warnings = 0;

function validate(label, condition, msg) {
  if (!condition) {
    console.log(`   ❌ ${label}: ${msg}`);
    errors++;
  }
}
function warn(label, msg) {
  console.log(`   ⚠️  ${label}: ${msg}`);
  warnings++;
}

// --- ENUM validation ---
const validGenders = ['Male', 'Female', 'Other'];
const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const validRoles = ['Doctor', 'Nurse', 'Technician', 'Admin', 'Receptionist'];
const validShifts = ['Morning', 'Afternoon', 'Night'];
const validUnitStatus = ['Available', 'Reserved', 'Used', 'Expired', 'Discarded'];
const validUrgency = ['Normal', 'Urgent', 'Critical'];
const validRequestStatus = ['Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'];
const validTestTypes = ['HIV', 'Hepatitis B', 'Hepatitis C', 'Syphilis', 'Malaria', 'Blood Group Confirm'];
const validResults = ['Positive', 'Negative', 'Pending'];

mysqlDonors.forEach(d => {
  validate(`donor[${d.donor_id}].gender`,       validGenders.includes(d.gender),       `"${d.gender}" not in ENUM`);
  validate(`donor[${d.donor_id}].blood_group`,   validBloodGroups.includes(d.blood_group), `"${d.blood_group}" not in ENUM`);
  validate(`donor[${d.donor_id}].phone`,          d.phone !== null,                       `phone is NULL (NOT NULL required)`);
  validate(`donor[${d.donor_id}].dob`,            d.dob !== null,                         `dob is NULL (NOT NULL required)`);
});

mysqlStaff.forEach(s => {
  validate(`staff[${s.staff_id}].role`,  validRoles.includes(s.role),   `"${s.role}" not in ENUM`);
  validate(`staff[${s.staff_id}].bank_id`, s.bank_id >= 1 && s.bank_id <= 10, `bank_id ${s.bank_id} out of range`);
});

mysqlReceivers.forEach(r => {
  validate(`receiver[${r.receiver_id}].blood_group`, validBloodGroups.includes(r.blood_group), `"${r.blood_group}" not in ENUM`);
});

mysqlBanks.forEach(b => {
  validate(`blood_bank[${b.bank_id}].name`,    b.name !== null && b.name.length > 0,    'name is empty');
  validate(`blood_bank[${b.bank_id}].address`,  b.address !== null && b.address.length > 0, 'address is empty (NOT NULL)');
  validate(`blood_bank[${b.bank_id}].phone`,    b.phone !== null && b.phone.length > 0,   'phone is empty (NOT NULL)');
  validate(`blood_bank[${b.bank_id}].email`,    b.email !== null && b.email.length > 0,   'email is empty (NOT NULL)');
});

mysqlUnits.forEach(u => {
  validate(`blood_unit[${u.unit_id}].bank_id`,      u.bank_id >= 1 && u.bank_id <= 10,     `bank_id ${u.bank_id} out of range`);
  validate(`blood_unit[${u.unit_id}].unit_code`,     u.unit_code && u.unit_code.length > 0,  'unit_code is empty (NOT NULL)');
  validate(`blood_unit[${u.unit_id}].blood_group`,   validBloodGroups.includes(u.blood_group), `"${u.blood_group}" not in ENUM`);
  validate(`blood_unit[${u.unit_id}].status`,         validUnitStatus.includes(u.status),      `"${u.status}" not in ENUM`);
});

mysqlEvents.forEach(e => {
  validate(`donation_event[${e.event_id}].donor_id`, e.donor_id >= 1 && e.donor_id <= 10, `donor_id ${e.donor_id} out of range`);
  validate(`donation_event[${e.event_id}].bank_id`,  e.bank_id >= 1 && e.bank_id <= 10,   `bank_id ${e.bank_id} out of range`);
});

mysqlTests.forEach(t => {
  validate(`blood_test[${t.test_id}].test_type`,    validTestTypes.includes(t.test_type),  `"${t.test_type}" not in ENUM`);
  validate(`blood_test[${t.test_id}].result`,        validResults.includes(t.result),       `"${t.result}" not in ENUM`);
  validate(`blood_test[${t.test_id}].event_id`,      t.event_id >= 1 && t.event_id <= 10,  `event_id ${t.event_id} out of range`);
  validate(`blood_test[${t.test_id}].donor_id`,      t.donor_id >= 1 && t.donor_id <= 10,  `donor_id ${t.donor_id} out of range`);
});

mysqlRequests.forEach(r => {
  validate(`blood_request[${r.request_id}].blood_group`,  validBloodGroups.includes(r.blood_group),   `"${r.blood_group}" not in ENUM`);
  validate(`blood_request[${r.request_id}].urgency`,       validUrgency.includes(r.urgency),           `"${r.urgency}" not in ENUM`);
  validate(`blood_request[${r.request_id}].status`,         validRequestStatus.includes(r.status),     `"${r.status}" not in ENUM`);
  validate(`blood_request[${r.request_id}].receiver_id`,   r.receiver_id >= 1 && r.receiver_id <= 10, `receiver_id ${r.receiver_id} out of range`);
  validate(`blood_request[${r.request_id}].bank_id`,       r.bank_id >= 1 && r.bank_id <= 10,         `bank_id ${r.bank_id} out of range`);
});

// Check for duplicate unique keys
const bankEmails = new Set();
mysqlBanks.forEach(b => {
  validate(`blood_bank[${b.bank_id}].email UNIQUE`, !bankEmails.has(b.email), `Duplicate email: ${b.email}`);
  bankEmails.add(b.email);
});

const donorEmails = new Set();
mysqlDonors.forEach(d => {
  if (d.email) {
    validate(`donor[${d.donor_id}].email UNIQUE`, !donorEmails.has(d.email), `Duplicate email: ${d.email}`);
    donorEmails.add(d.email);
  }
});

const staffEmails = new Set();
mysqlStaff.forEach(s => {
  if (s.email) {
    validate(`staff[${s.staff_id}].email UNIQUE`, !staffEmails.has(s.email), `Duplicate email: ${s.email}`);
    staffEmails.add(s.email);
  }
});

// Check unit_code uniqueness per bank
const unitCodeKeys = new Set();
mysqlUnits.forEach(u => {
  const key = `${u.bank_id}:${u.unit_code}`;
  validate(`blood_unit[${u.unit_id}] UNIQUE(bank_id,unit_code)`, !unitCodeKeys.has(key), `Duplicate: ${key}`);
  unitCodeKeys.add(key);
});

// Check donation_event.unit_id uniqueness
const eventUnitIds = new Set();
mysqlEvents.forEach(e => {
  if (e.unit_id) {
    validate(`donation_event[${e.event_id}].unit_id UNIQUE`, !eventUnitIds.has(e.unit_id), `Duplicate unit_id: ${e.unit_id}`);
    eventUnitIds.add(e.unit_id);
  }
});

// Check blood_request.unit_id uniqueness
const requestUnitIds = new Set();
mysqlRequests.forEach(r => {
  if (r.unit_id) {
    validate(`blood_request[${r.request_id}].unit_id UNIQUE`, !requestUnitIds.has(r.unit_id), `Duplicate unit_id: ${r.unit_id}`);
    requestUnitIds.add(r.unit_id);
  }
});

console.log(`\n   ───────────────────────────────`);
if (errors === 0) {
  console.log(`   ✅ VALIDATION PASSED — 0 errors, ${warnings} warnings`);
} else {
  console.log(`   ❌ VALIDATION FAILED — ${errors} errors, ${warnings} warnings`);
}
console.log(`   ───────────────────────────────\n`);


// ===================================================================
//  SECTION 5 — SQL GENERATION
// ===================================================================

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function generateSQL() {
  const lines = [];
  lines.push('-- ============================================================');
  lines.push('--  AUTO-GENERATED: Oracle → MySQL Migration SQL');
  lines.push(`--  Generated: ${new Date().toISOString()}`);
  lines.push('--  Source: BloodBankDB_Oracle.sql');
  lines.push('--  Target: blood_bank_db (MySQL)');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS = 0;');
  lines.push('');

  // TRUNCATE in reverse dependency order
  lines.push('-- Clear existing dummy data');
  lines.push('TRUNCATE TABLE blood_test;');
  lines.push('TRUNCATE TABLE blood_request;');
  lines.push('TRUNCATE TABLE donation_event;');
  lines.push('TRUNCATE TABLE blood_unit;');
  lines.push('TRUNCATE TABLE receiver;');
  lines.push('TRUNCATE TABLE donor;');
  lines.push('TRUNCATE TABLE staff_credentials;');
  lines.push('TRUNCATE TABLE staff;');
  lines.push('TRUNCATE TABLE blood_bank;');
  lines.push('');

  // INSERT blood_bank
  lines.push('-- blood_bank (10 rows)');
  mysqlBanks.forEach(b => {
    lines.push(`INSERT INTO blood_bank (bank_id, name, address, city, state, phone, email, capacity, established) VALUES (${b.bank_id}, ${esc(b.name)}, ${esc(b.address)}, ${esc(b.city)}, ${esc(b.state)}, ${esc(b.phone)}, ${esc(b.email)}, ${b.capacity}, ${esc(b.established)});`);
  });
  lines.push('');

  // INSERT staff
  lines.push('-- staff (10 rows)');
  mysqlStaff.forEach(s => {
    lines.push(`INSERT INTO staff (staff_id, bank_id, first_name, last_name, role, phone, email, shift, hired_date) VALUES (${s.staff_id}, ${s.bank_id}, ${esc(s.first_name)}, ${esc(s.last_name)}, ${esc(s.role)}, ${esc(s.phone)}, ${esc(s.email)}, ${esc(s.shift)}, ${esc(s.hired_date)});`);
  });
  lines.push('');

  // INSERT donor
  lines.push('-- donor (10 rows)');
  mysqlDonors.forEach(d => {
    lines.push(`INSERT INTO donor (donor_id, first_name, last_name, dob, gender, blood_group, phone, email, street, city, state, total_donations, last_donation, is_eligible) VALUES (${d.donor_id}, ${esc(d.first_name)}, ${esc(d.last_name)}, ${esc(d.dob)}, ${esc(d.gender)}, ${esc(d.blood_group)}, ${esc(d.phone)}, ${esc(d.email)}, ${esc(d.street)}, ${esc(d.city)}, ${esc(d.state)}, ${d.total_donations}, ${esc(d.last_donation)}, ${d.is_eligible});`);
  });
  lines.push('');

  // INSERT receiver
  lines.push('-- receiver (10 rows)');
  mysqlReceivers.forEach(r => {
    lines.push(`INSERT INTO receiver (receiver_id, first_name, last_name, dob, gender, blood_group, phone, email, hospital_name, hospital_city, medical_condition) VALUES (${r.receiver_id}, ${esc(r.first_name)}, ${esc(r.last_name)}, ${esc(r.dob)}, ${esc(r.gender)}, ${esc(r.blood_group)}, ${esc(r.phone)}, ${esc(r.email)}, ${esc(r.hospital_name)}, ${esc(r.hospital_city)}, ${esc(r.medical_condition)});`);
  });
  lines.push('');

  // INSERT blood_unit
  lines.push('-- blood_unit (10 rows)');
  mysqlUnits.forEach(u => {
    lines.push(`INSERT INTO blood_unit (unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp) VALUES (${u.unit_id}, ${u.bank_id}, ${esc(u.unit_code)}, ${esc(u.blood_group)}, ${u.volume_ml}, ${esc(u.collected_date)}, ${esc(u.expiry_date)}, ${esc(u.status)}, ${u.storage_temp});`);
  });
  lines.push('');

  // INSERT donation_event
  lines.push('-- donation_event (10 rows)');
  mysqlEvents.forEach(e => {
    lines.push(`INSERT INTO donation_event (event_id, donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes) VALUES (${e.event_id}, ${e.donor_id}, ${e.bank_id}, ${esc(e.unit_id)}, ${esc(e.event_date)}, ${esc(e.event_time)}, ${esc(e.staff_id)}, ${esc(e.notes)});`);
  });
  lines.push('');

  // INSERT blood_test
  lines.push('-- blood_test (10 rows)');
  mysqlTests.forEach(t => {
    lines.push(`INSERT INTO blood_test (test_id, event_id, donor_id, test_type, tested_date, result, tested_by, remarks) VALUES (${t.test_id}, ${t.event_id}, ${t.donor_id}, ${esc(t.test_type)}, ${esc(t.tested_date)}, ${esc(t.result)}, ${esc(t.tested_by)}, ${esc(t.remarks)});`);
  });
  lines.push('');

  // INSERT blood_request
  lines.push('-- blood_request (10 rows)');
  mysqlRequests.forEach(r => {
    lines.push(`INSERT INTO blood_request (request_id, receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency, request_date, required_by, status, handled_by, notes) VALUES (${r.request_id}, ${r.receiver_id}, ${r.bank_id}, ${esc(r.unit_id)}, ${esc(r.blood_group)}, ${r.quantity_ml}, ${esc(r.urgency)}, ${esc(r.request_date)}, ${esc(r.required_by)}, ${esc(r.status)}, ${esc(r.handled_by)}, ${esc(r.notes)});`);
  });
  lines.push('');

  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  lines.push('');
  lines.push('-- Re-seed staff_credentials (run seedAuth.js after this)');
  lines.push('-- Or manually insert:');
  lines.push('-- INSERT INTO staff_credentials (staff_id, password_hash)');
  lines.push('-- SELECT staff_id, \'$2b$10$...\' FROM staff;');
  lines.push('');

  return lines.join('\n');
}

const sqlContent = generateSQL();


// ===================================================================
//  SECTION 6 — OUTPUT
// ===================================================================

console.log(`${'─'.repeat(60)}`);
console.log('  SUMMARY');
console.log(`${'─'.repeat(60)}`);
console.log(`  blood_bank:       ${mysqlBanks.length} rows`);
console.log(`  staff:            ${mysqlStaff.length} rows`);
console.log(`  donor:            ${mysqlDonors.length} rows`);
console.log(`  receiver:         ${mysqlReceivers.length} rows`);
console.log(`  blood_unit:       ${mysqlUnits.length} rows`);
console.log(`  donation_event:   ${mysqlEvents.length} rows`);
console.log(`  blood_test:       ${mysqlTests.length} rows`);
console.log(`  blood_request:    ${mysqlRequests.length} rows`);
console.log(`  ────────────────────────────`);
console.log(`  TOTAL:            ${mysqlBanks.length + mysqlStaff.length + mysqlDonors.length + mysqlReceivers.length + mysqlUnits.length + mysqlEvents.length + mysqlTests.length + mysqlRequests.length} rows`);
console.log('');

if (MODE === 'dry-run') {
  console.log('🔍 DRY RUN complete. No changes made.');
  console.log('   To generate SQL file: node migrateOracleData.js --generate');
  console.log('   To execute migration:  node migrateOracleData.js --execute');
  if (errors > 0) {
    console.log(`\n   ❌ Fix ${errors} validation errors before executing.`);
    process.exit(1);
  }
  process.exit(0);
}

if (MODE === 'generate') {
  const outPath = path.resolve(__dirname, '../../database/migration.sql');
  fs.writeFileSync(outPath, sqlContent, 'utf8');
  console.log(`📄 Migration SQL written to: ${outPath}`);
  console.log(`   Review it, then run: mysql -u root -p blood_bank_db < database/migration.sql`);
  if (errors > 0) {
    console.log(`\n   ⚠️  ${errors} validation errors detected — review before executing.`);
  }
  process.exit(0);
}

if (MODE === 'execute') {
  if (errors > 0) {
    console.log(`❌ Cannot execute — ${errors} validation errors. Fix them first.`);
    process.exit(1);
  }

  (async () => {
    const pool = require('../config/db');
    const bcrypt = require('bcrypt');

    try {
      console.log('🚀 Executing migration against MySQL...\n');

      // Run all statements within a transaction-like scope
      const conn = await pool.getConnection();

      await conn.query('SET FOREIGN_KEY_CHECKS = 0');

      // TRUNCATE
      console.log('   🗑️  Truncating existing data...');
      const tables = ['blood_test', 'blood_request', 'donation_event', 'blood_unit', 'receiver', 'donor', 'staff_credentials', 'staff', 'blood_bank'];
      for (const t of tables) {
        await conn.query(`TRUNCATE TABLE ${t}`);
      }
      console.log('   ✓ All tables truncated');

      // INSERT blood_bank
      console.log('   📥 Inserting blood_bank...');
      for (const b of mysqlBanks) {
        await conn.query(
          'INSERT INTO blood_bank (bank_id,name,address,city,state,phone,email,capacity,established) VALUES (?,?,?,?,?,?,?,?,?)',
          [b.bank_id, b.name, b.address, b.city, b.state, b.phone, b.email, b.capacity, b.established]
        );
      }

      // INSERT staff
      console.log('   📥 Inserting staff...');
      for (const s of mysqlStaff) {
        await conn.query(
          'INSERT INTO staff (staff_id,bank_id,first_name,last_name,role,phone,email,shift,hired_date) VALUES (?,?,?,?,?,?,?,?,?)',
          [s.staff_id, s.bank_id, s.first_name, s.last_name, s.role, s.phone, s.email, s.shift, s.hired_date]
        );
      }

      // INSERT donor
      console.log('   📥 Inserting donor...');
      for (const d of mysqlDonors) {
        await conn.query(
          'INSERT INTO donor (donor_id,first_name,last_name,dob,gender,blood_group,phone,email,street,city,state,total_donations,last_donation,is_eligible) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [d.donor_id, d.first_name, d.last_name, d.dob, d.gender, d.blood_group, d.phone, d.email, d.street, d.city, d.state, d.total_donations, d.last_donation, d.is_eligible]
        );
      }

      // INSERT receiver
      console.log('   📥 Inserting receiver...');
      for (const r of mysqlReceivers) {
        await conn.query(
          'INSERT INTO receiver (receiver_id,first_name,last_name,dob,gender,blood_group,phone,email,hospital_name,hospital_city,medical_condition) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [r.receiver_id, r.first_name, r.last_name, r.dob, r.gender, r.blood_group, r.phone, r.email, r.hospital_name, r.hospital_city, r.medical_condition]
        );
      }

      // INSERT blood_unit
      console.log('   📥 Inserting blood_unit...');
      for (const u of mysqlUnits) {
        await conn.query(
          'INSERT INTO blood_unit (unit_id,bank_id,unit_code,blood_group,volume_ml,collected_date,expiry_date,status,storage_temp) VALUES (?,?,?,?,?,?,?,?,?)',
          [u.unit_id, u.bank_id, u.unit_code, u.blood_group, u.volume_ml, u.collected_date, u.expiry_date, u.status, u.storage_temp]
        );
      }

      // INSERT donation_event
      console.log('   📥 Inserting donation_event...');
      for (const e of mysqlEvents) {
        await conn.query(
          'INSERT INTO donation_event (event_id,donor_id,bank_id,unit_id,event_date,event_time,staff_id,notes) VALUES (?,?,?,?,?,?,?,?)',
          [e.event_id, e.donor_id, e.bank_id, e.unit_id, e.event_date, e.event_time, e.staff_id, e.notes]
        );
      }

      // INSERT blood_test
      console.log('   📥 Inserting blood_test...');
      for (const t of mysqlTests) {
        await conn.query(
          'INSERT INTO blood_test (test_id,event_id,donor_id,test_type,tested_date,result,tested_by,remarks) VALUES (?,?,?,?,?,?,?,?)',
          [t.test_id, t.event_id, t.donor_id, t.test_type, t.tested_date, t.result, t.tested_by, t.remarks]
        );
      }

      // INSERT blood_request
      console.log('   📥 Inserting blood_request...');
      for (const r of mysqlRequests) {
        await conn.query(
          'INSERT INTO blood_request (request_id,receiver_id,bank_id,unit_id,blood_group,quantity_ml,urgency,request_date,required_by,status,handled_by,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          [r.request_id, r.receiver_id, r.bank_id, r.unit_id, r.blood_group, r.quantity_ml, r.urgency, r.request_date, r.required_by, r.status, r.handled_by, r.notes]
        );
      }

      await conn.query('SET FOREIGN_KEY_CHECKS = 1');

      // Re-seed staff_credentials
      console.log('   🔐 Re-seeding staff_credentials...');
      const passwordHash = await bcrypt.hash('password123', 10);
      for (const s of mysqlStaff) {
        await conn.query(
          'INSERT INTO staff_credentials (staff_id, password_hash) VALUES (?, ?)',
          [s.staff_id, passwordHash]
        );
      }

      conn.release();

      console.log('\n   ════════════════════════════════════');
      console.log('   ✅ MIGRATION COMPLETE — 80 rows inserted');
      console.log('   ════════════════════════════════════');
      console.log('   🔑 Default password for all staff: password123');
      console.log('   📧 Login emails: check staff table\n');

      process.exit(0);
    } catch (err) {
      console.error('\n   ❌ Migration failed:', err.message);
      console.error('   Full error:', err);
      process.exit(1);
    }
  })();
}
