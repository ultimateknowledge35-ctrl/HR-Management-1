const db = require('./config/db');
const { hashPassword } = require('./utils/auth');

function seedDatabase() {
  console.log('Seeding database...');

  // Clear existing data in correct FK order
  db.exec(`
    DELETE FROM complaints;
    DELETE FROM advance_requests;
    DELETE FROM salary_payments;
    DELETE FROM attendance;
    DELETE FROM expenses;
    DELETE FROM staff;
    DELETE FROM users;
  `);

  // 1. Create Admin
  const adminPassHash = hashPassword('admin123');
  const staffPassHash = hashPassword('staff123');

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `);

  const adminResult = insertUser.run('admin', adminPassHash, 'ADMIN');
  const adminUserId = adminResult.lastInsertRowid;

  // 2. Create 8 Staff Users and Staff Profiles
  const staffData = [
    {
      username: 'sarah',
      name: 'Sarah Connor',
      email: 'sarah.connor@apex.local',
      phone: '+1 (555) 234-5671',
      address: '742 Evergreen Terrace, Springfield',
      department: 'Engineering',
      job_title: 'Senior Full-Stack Engineer',
      join_date: '2023-03-15',
      monthly_salary: 6800,
      status: 'ACTIVE'
    },
    {
      username: 'david',
      name: 'David Miller',
      email: 'david.miller@apex.local',
      phone: '+1 (555) 345-6782',
      address: '124 Conch Street, Pacific City',
      department: 'Human Resources',
      job_title: 'HR Coordinator',
      join_date: '2023-06-01',
      monthly_salary: 4300,
      status: 'ACTIVE'
    },
    {
      username: 'priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@apex.local',
      phone: '+1 (555) 456-7893',
      address: '456 Elmwood Avenue, Silicon Metro',
      department: 'Design',
      job_title: 'Lead UI/UX Designer',
      join_date: '2023-09-10',
      monthly_salary: 5900,
      status: 'ACTIVE'
    },
    {
      username: 'michael',
      name: 'Michael Chang',
      email: 'michael.chang@apex.local',
      phone: '+1 (555) 567-8904',
      address: '88 Lotus Grove Way, Metro City',
      department: 'Sales',
      job_title: 'Senior Account Executive',
      join_date: '2024-01-20',
      monthly_salary: 5100,
      status: 'ACTIVE'
    },
    {
      username: 'elena',
      name: 'Elena Rostova',
      email: 'elena.rostova@apex.local',
      phone: '+1 (555) 678-9015',
      address: '32 Riverview Boulevard, Bay Area',
      department: 'Finance',
      job_title: 'Senior Financial Analyst',
      join_date: '2023-11-05',
      monthly_salary: 5500,
      status: 'ACTIVE'
    },
    {
      username: 'james',
      name: 'James Wilson',
      email: 'james.wilson@apex.local',
      phone: '+1 (555) 789-0126',
      address: '900 Highland Park Road, Austin',
      department: 'Operations',
      job_title: 'DevOps & Infrastructure Lead',
      join_date: '2022-08-14',
      monthly_salary: 6400,
      status: 'ACTIVE'
    },
    {
      username: 'aisha',
      name: 'Aisha Patel',
      email: 'aisha.patel@apex.local',
      phone: '+1 (555) 890-1237',
      address: '15 Sunrise Point, Seattle',
      department: 'Marketing',
      job_title: 'Growth & Brand Specialist',
      join_date: '2024-03-01',
      monthly_salary: 4700,
      status: 'ACTIVE'
    },
    {
      username: 'robert',
      name: 'Robert Fox',
      email: 'robert.fox@apex.local',
      phone: '+1 (555) 901-2348',
      address: '502 Pinecrest Hill, Denver',
      department: 'Support',
      job_title: 'Customer Success Specialist',
      join_date: '2024-04-12',
      monthly_salary: 3800,
      status: 'ACTIVE'
    },
    {
      username: 'clara',
      name: 'Clara Oswald',
      email: 'clara.oswald@apex.local',
      phone: '+1 (555) 111-2233',
      address: '10 Downing St, London',
      department: 'Marketing',
      job_title: 'Junior Copywriter',
      join_date: '2023-01-10',
      monthly_salary: 3500,
      status: 'INACTIVE'
    }
  ];

  const insertStaff = db.prepare(`
    INSERT INTO staff (user_id, name, email, phone, address, department, job_title, join_date, monthly_salary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdStaff = [];

  for (const s of staffData) {
    const userRes = insertUser.run(s.username, staffPassHash, 'STAFF');
    const staffRes = insertStaff.run(
      userRes.lastInsertRowid,
      s.name,
      s.email,
      s.phone,
      s.address,
      s.department,
      s.job_title,
      s.join_date,
      s.monthly_salary,
      s.status
    );
    createdStaff.push({
      ...s,
      id: staffRes.lastInsertRowid,
      userId: userRes.lastInsertRowid
    });
  }

  // 3. Seed Attendance for the last 14 days
  const insertAttendance = db.prepare(`
    INSERT OR REPLACE INTO attendance (staff_id, date, status, note)
    VALUES (?, ?, ?, ?)
  `);

  const today = new Date();
  const activeStaff = createdStaff.filter(s => s.status === 'ACTIVE');

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toISOString().split('T')[0];

    activeStaff.forEach((st, idx) => {
      let status = 'PRESENT';
      let note = 'On time';

      // Seed realistic distribution
      if ((i + idx) % 9 === 0) {
        status = 'LATE';
        note = 'Late by 25 mins (traffic)';
      } else if ((i + idx) % 13 === 0) {
        status = 'LEAVE';
        note = 'Approved personal leave';
      } else if (i === 1 && idx === 3) {
        status = 'ABSENT';
        note = 'Unexcused absence';
      }

      insertAttendance.run(st.id, dateStr, status, note);
    });
  }

  // 4. Seed Advance & Loan Requests
  const insertRequest = db.prepare(`
    INSERT INTO advance_requests (staff_id, type, amount, months, monthly_installment, reason, status, admin_note, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sarah has an approved loan with active deduction
  insertRequest.run(
    createdStaff[0].id,
    'LOAN',
    1200,
    3,
    400,
    'Home workstation upgrade and ergonomic equipment',
    'APPROVED',
    'Approved per annual equipment allowance policy',
    new Date().toISOString()
  );

  // Michael has a pending advance request
  insertRequest.run(
    createdStaff[3].id,
    'ADVANCE',
    600,
    1,
    600,
    'Emergency car repair expenses',
    'PENDING',
    null,
    null
  );

  // Aisha had a loan request rejected
  insertRequest.run(
    createdStaff[6].id,
    'LOAN',
    2500,
    3,
    833.33,
    'Personal travel expenses',
    'REJECTED',
    'Amount exceeds standard policy limit for tenure',
    new Date().toISOString()
  );

  // 5. Seed Complaints
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (staff_id, type, description, status, admin_response)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertComplaint.run(
    createdStaff[4].id,
    'Facilities',
    'The air conditioning in the 2nd floor East wing is freezing cold and making it hard to concentrate.',
    'OPEN',
    null
  );

  insertComplaint.run(
    createdStaff[7].id,
    'Equipment',
    'The noise cancelling headset microphone produces constant static during customer support calls.',
    'IN_REVIEW',
    'IT support has logged a replacement order.'
  );

  insertComplaint.run(
    createdStaff[1].id,
    'Workplace',
    'Pantry espresso machine needs routine descaling and bean restocking.',
    'RESOLVED',
    'Maintenance completed yesterday and beans replenished.'
  );

  // 6. Seed Salary Payments (Previous Month & Current Month)
  const insertPayment = db.prepare(`
    INSERT OR REPLACE INTO salary_payments (staff_id, year, month, base_salary, deductions, net_pay, status, payment_date, payment_method, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Previous month paid for all active staff
  for (const st of activeStaff) {
    const prevPaymentDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-28`;
    insertPayment.run(
      st.id,
      prevYear,
      prevMonth,
      st.monthly_salary,
      0,
      st.monthly_salary,
      'PAID',
      prevPaymentDate,
      'Bank Transfer',
      `Regular payroll payment for ${prevMonth}/${prevYear}`
    );
  }

  // Current month: 4 staff paid, 4 pending/upcoming
  // Sarah has approved loan deduction of $400
  insertPayment.run(
    createdStaff[0].id,
    currentYear,
    currentMonth,
    createdStaff[0].monthly_salary,
    400,
    createdStaff[0].monthly_salary - 400,
    'PAID',
    `${currentYear}-${String(currentMonth).padStart(2, '0')}-05`,
    'Bank Transfer',
    'Paid early with loan installment deduction'
  );

  insertPayment.run(
    createdStaff[1].id,
    currentYear,
    currentMonth,
    createdStaff[1].monthly_salary,
    0,
    createdStaff[1].monthly_salary,
    'PAID',
    `${currentYear}-${String(currentMonth).padStart(2, '0')}-06`,
    'Bank Transfer',
    'Payroll processed'
  );

  insertPayment.run(
    createdStaff[2].id,
    currentYear,
    currentMonth,
    createdStaff[2].monthly_salary,
    0,
    createdStaff[2].monthly_salary,
    'PAID',
    `${currentYear}-${String(currentMonth).padStart(2, '0')}-07`,
    'Bank Transfer',
    'Direct deposit processed'
  );

  // 7. Seed Office Expenses (Spanning Last 12 Months, Current Month, and Today)
  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, amount, expense_date, description)
    VALUES (?, ?, ?, ?)
  `);

  const categories = ['Utility Bills', 'Office Supplies', 'Rent', 'Equipment', 'Maintenance', 'Internet & Software'];

  // Past 12 months expenses
  for (let m = 11; m >= 0; m--) {
    const expDate = new Date(today.getFullYear(), today.getMonth() - m, 10);
    const y = expDate.getFullYear();
    const mo = String(expDate.getMonth() + 1).padStart(2, '0');

    insertExpense.run('Rent', 3200, `${y}-${mo}-01`, 'Monthly corporate office space lease');
    insertExpense.run('Utility Bills', 450 + Math.floor(Math.random() * 200), `${y}-${mo}-05`, 'Electricity, water, and heating');
    insertExpense.run('Internet & Software', 680, `${y}-${mo}-12`, 'Fiber connection, cloud licenses & GitHub enterprise');
    insertExpense.run('Office Supplies', 220 + Math.floor(Math.random() * 150), `${y}-${mo}-18`, 'Stationery, printing supplies, and pantry stock');
    if (m % 3 === 0) {
      insertExpense.run('Equipment', 850 + Math.floor(Math.random() * 400), `${y}-${mo}-22`, 'Dual-monitor mounts & ergonomics');
    }
  }

  // Today's expenses
  const todayStr = today.toISOString().split('T')[0];
  insertExpense.run('Office Supplies', 85, todayStr, 'Pantry gourmet coffee beans and organic snacks');
  insertExpense.run('Maintenance', 140, todayStr, 'HVAC air filter replacement service');

  // Ensure settings are set
  const upsertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  upsertSetting.run('company_name', 'Apex HR Systems');
  upsertSetting.run('currency_symbol', '$');
  upsertSetting.run('payday_day', '28');
  upsertSetting.run('max_advance_months', '3');

  console.log('✅ Database seeded successfully!');
  console.log('Admin account: admin / admin123');
  console.log('Demo staff accounts: sarah, david, priya, michael, elena, james, aisha, robert (password: staff123)');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
