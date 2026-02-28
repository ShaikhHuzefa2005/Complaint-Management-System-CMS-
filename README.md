# CMS — Complaint Management System
### Full-Stack Node.js + Express + MySQL + EJS

---

## 📁 PROJECT STRUCTURE

```
cms/
├── server.js                   # Entry point
├── package.json
├── .env                        # Environment variables
├── database.sql                # MySQL schema + seed
│
├── config/
│   └── db.js                   # MySQL connection pool
│
├── controllers/
│   ├── authController.js       # Login, Register, Logout
│   ├── studentController.js    # Student dashboard, complaints, profile
│   ├── staffController.js      # Staff dashboard, complaints, profile
│   └── adminController.js      # Admin dashboard, complaints, users
│
├── middleware/
│   └── auth.js                 # isStudent, isStaff, isAdmin, etc.
│
├── routes/
│   ├── auth.js                 # /login, /register, /logout
│   ├── student.js              # /student/*
│   ├── staff.js                # /staff/*
│   └── admin.js                # /admin/*
│
├── views/
│   ├── index.ejs               # Landing page
│   ├── login.ejs               # Login page
│   ├── register.ejs            # Register page
│   ├── 404.ejs                 # Error page
│   ├── partials/
│   │   ├── head.ejs            # HTML <head> + Tailwind
│   │   ├── flash.ejs           # Flash messages (error/success)
│   │   ├── sidebar-student.ejs
│   │   ├── sidebar-staff.ejs
│   │   └── sidebar-admin.ejs
│   ├── student/
│   │   ├── dashboard.ejs
│   │   ├── complaints.ejs
│   │   ├── complaint-detail.ejs
│   │   ├── new-complaint.ejs
│   │   └── profile.ejs
│   ├── staff/
│   │   ├── dashboard.ejs
│   │   ├── complaints.ejs
│   │   ├── complaint-detail.ejs
│   │   └── profile.ejs
│   └── admin/
│       ├── dashboard.ejs
│       ├── complaints.ejs
│       ├── complaint-detail.ejs
│       └── users.ejs
│
└── public/
    ├── css/
    │   └── style.css           # Original design CSS
    ├── js/                     # Client-side scripts (optional)
    └── assets/                 # Images from original frontend
```

---

## 🚀 SETUP INSTRUCTIONS

### Prerequisites
- Node.js (v18+)
- XAMPP (for MySQL)
- A browser

---

### Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Open phpMyAdmin at `http://localhost/phpmyadmin`

### Step 2: Create Database
1. In phpMyAdmin, click **New**
2. Name it `cms_db` and click **Create**
3. Click on `cms_db` → **SQL** tab
4. Paste the contents of `database.sql` and click **Go**

This will create:
- `users` table
- `complaints` table
- `comments` table
- `activity_logs` table
- A default admin account (see below)

### Step 3: Install Dependencies
```bash
cd cms
npm install
```

### Step 4: Configure Environment
Edit `.env` if needed:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty for default XAMPP
DB_NAME=cms_db
SESSION_SECRET=cms_super_secret_key_2024_change_in_production
```

> If your XAMPP MySQL has a password, set it in DB_PASSWORD.

### Step 5: Run the Server
```bash
npm start
# or for development with auto-restart:
npm run dev
```

Visit: **http://localhost:3000**

---

## 👥 DEFAULT ACCOUNTS

To create test accounts, use the Register page with roles: Student, Staff, or Admin.

---

## 🔐 AUTH WORKFLOW

```
User → /register → POST /register → Hashed password stored → Redirect /login
User → /login → POST /login → Session created → Redirect to role dashboard
User → /logout → Session destroyed → Redirect /login
```

### Role-Based Redirects:
| Role    | After Login           |
|---------|----------------------|
| student | /student/dashboard   |
| staff   | /staff/dashboard     |
| admin   | /admin/dashboard     |

---

## 📋 ROUTES REFERENCE

### Auth Routes
| Method | Route       | Description        |
|--------|-------------|-------------------|
| GET    | /           | Landing page       |
| GET    | /login      | Login form         |
| POST   | /login      | Process login      |
| GET    | /register   | Register form      |
| POST   | /register   | Process register   |
| GET    | /logout     | Destroy session    |

### Student Routes (require isStudent middleware)
| Method | Route                               | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | /student/dashboard                  | Dashboard + stats        |
| GET    | /student/complaints                 | All my complaints        |
| GET    | /student/complaints/:id             | Complaint detail         |
| POST   | /student/complaints/:id/comment     | Add comment              |
| GET    | /student/new-complaint              | New complaint form       |
| POST   | /student/new-complaint              | Submit complaint         |
| GET    | /student/profile                    | Profile page             |
| POST   | /student/profile/change-password    | Change password          |

### Staff Routes (require isStaff middleware)
| Method | Route                               | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | /staff/dashboard                    | Dashboard + stats        |
| GET    | /staff/complaints                   | Assigned complaints      |
| GET    | /staff/complaints/:id               | Complaint detail         |
| POST   | /staff/complaints/:id/update        | Update status + note     |
| GET    | /staff/profile                      | Profile page             |
| POST   | /staff/profile/change-password      | Change password          |

### Admin Routes (require isAdmin middleware)
| Method | Route                               | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | /admin/dashboard                    | Dashboard + all stats    |
| GET    | /admin/complaints                   | All complaints table     |
| GET    | /admin/complaints/:id               | Manage complaint         |
| POST   | /admin/complaints/:id/manage        | Assign + update status   |
| POST   | /admin/complaints/:id/comment       | Add admin note           |
| GET    | /admin/users                        | All users                |
| POST   | /admin/users/:id/toggle             | Activate/deactivate user |
| POST   | /admin/users/:id/delete             | Delete user              |

---

## 🗄️ DATABASE SCHEMA

```sql
users          (id, name, email, password, role, is_active, created_at)
complaints     (id, student_id, title, description, category, status, assigned_staff_id, created_at, updated_at)
comments       (id, complaint_id, user_id, message, created_at)
activity_logs  (id, complaint_id, action, user_id, timestamp)
```

### Status Values:
- `open` → New, unresolved
- `in_progress` → Assigned to staff, being worked on
- `resolved` → Completed

### Role Values:
- `student`, `staff`, `admin`

---

## 🧩 EJS PARTIAL SYSTEM

Every page uses partials:
```ejs
<%- include('partials/head') %>        ← <head>, Tailwind, Google Charts
<%- include('partials/flash') %>       ← error/success flash messages
<%- include('partials/sidebar-student') %>   ← sidebar with active link
```

Active link is passed from controller:
```js
res.render('student/dashboard', { active: 'dashboard', ... });
```

In sidebar EJS:
```ejs
class="<%= active === 'dashboard' ? 'bg-[var(--highlight-light)] text-white ...' : '...' %>"
```

---

## 🔑 SECURITY

- Passwords hashed with **bcrypt** (salt rounds: 10)
- Session-based auth with `express-session`
- All routes protected by role middleware
- User deactivation by admin blocks login
- XSS protection via EJS auto-escaping `<%= %>`
- SQL injection protection via parameterized queries (`?` placeholders)

---

## 🎨 DESIGN TOKENS (CSS Variables)

```css
--gray:             #6E7C40;
--white:            #FCFBFC;
--highlight:        #283618;       /* Dark green - primary text/bg */
--highlight-light:  #606C38;       /* Medium green - sidebar active */
--hover-color:      #DDA15E;       /* Warm orange - sidebar bg */
--hover-color-dark: #BC6C25;       /* Dark orange - hover states */
```

---

## 🧰 TECH STACK

| Layer      | Technology          |
|------------|---------------------|
| Backend    | Node.js + Express   |
| Templating | EJS                 |
| Database   | MySQL (via XAMPP)   |
| ORM/Query  | mysql2 (raw SQL)    |
| Auth       | express-session     |
| Passwords  | bcrypt              |
| CSS        | TailwindCSS (CDN)   |
| Charts     | Google Charts       |
| Fonts      | Inter + Playfair    |

---

## 🐛 TROUBLESHOOTING

**DB Connection Refused:**
- Ensure XAMPP MySQL is running
- Check DB_USER and DB_PASSWORD in .env

**Session not persisting:**
- Ensure SESSION_SECRET is set in .env

**Cannot find module:**
- Run `npm install` from the cms directory

**Charts not loading:**
- Requires internet access for Google Charts CDN

---

## 📈 EXTENDING THE SYSTEM

**Add email notifications:**
```bash
npm install nodemailer
```
Send email when complaint is assigned or resolved.

**Add file attachments:**
```bash
npm install multer
```
Handle file uploads on complaint creation.

**Add pagination:**
Use SQL `LIMIT` and `OFFSET` on complaint listing queries.

**Deploy:**
- Use `pm2` for process management
- Switch XAMPP MySQL to a hosted MySQL (PlanetScale, Railway, etc.)
- Set NODE_ENV=production and use a strong SESSION_SECRET
