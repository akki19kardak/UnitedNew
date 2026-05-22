<p align="center">
  <img src="https://unitedimpact-app.netlify.app/fav.png" alt="UnitedImpact Logo" width="100"/>
</p>

<h1 align="center">UnitedImpact 🌍</h1>

<p align="center">
  A full-stack NGO donation and volunteer management platform that bridges the gap between non-profits, dedicated volunteers, and generous donors.
</p>

<p align="center">
  <a href="https://unitedimpact-app.netlify.app">
    <img src="https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify" />
  </a>
  <a href="https://unitedimpact-backend.onrender.com">
    <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render" />
  </a>
     <a href="https://unitedimpact-app.netlify.app/admin/registe">
    <img src="https://img.shields.io/badge/Admin-Netlify-46E3B7?style=for-the-badge&logo=netlify" />
  </a>
</p>

---

## 🔗 Live Links

| Service | URL |
|---|---|
| 🌐 Frontend | [unitedimpact-app.netlify.app](https://unitedimpact-app.netlify.app) |
| 🔧 Backend API | [unitedimpact-backend.onrender.com](https://unitedimpact-backend.onrender.com) |
| 🛡️ Admin Panel | [unitedimpact-app.netlify.app/admin/register](https://unitedimpact-app.netlify.app/admin/register) |

---

## ✨ Features

### 🙋 For Donors
- Browse and search verified campaigns with map-based discovery
- Secure donations via Razorpay (UPI, cards, net banking)
- Personalised impact reports per campaign
- XP-based achievement and leveling system
- Monthly donation trend charts

### 🤝 For Volunteers
- Sign up for campaigns with role and message
- Track approved campaigns, hours logged, and schedule
- Achievement system with XP from hours and campaigns
- Real-time volunteer status updates

### 🏢 For NGOs
- Register and get verified by platform admins
- Create and manage campaigns with geocoded locations
- Approve or reject volunteer applications
- View fundraising stats and donation trends
- Real-time campaign location updates via Socket.IO

### 🛡️ For Admins
- Dedicated admin dashboard with platform-wide stats
- Verify or reject NGO registrations (syncs both User and NGO models)
- Approve or reject campaign submissions
- View all users, donations, and recent activity feed
- Role management across all user types
- Analytics with charts and export options

### ⚙️ General
- Firebase Authentication (email/password + Google sign-in)
- Role selection on first login (donor / volunteer / NGO)
- Dark mode support
- Real-time data polling (30s intervals)
- Responsive design (mobile + desktop)
- Protected and role-based routing

---

## 🛠️ Tech Stack

### Frontend
| Technology | Usage |
|---|---|
| React + Vite | Frontend framework |
| Tailwind CSS | Styling |
| Firebase Auth | Authentication |
| Axios | API calls |
| Socket.IO Client | Real-time messaging |
| React Router | Client-side routing |
| Leaflet | Map-based campaign discovery |
| Recharts | Donation trend charts |

### Backend
| Technology | Usage |
|---|---|
| Node.js + Express | Backend server |
| MongoDB + Mongoose | Database |
| Firebase Admin | Token verification |
| Razorpay | Payment gateway |
| Socket.IO | Real-time communication |
| Cloudinary | Image hosting |
| Nodemailer | Email notifications |
| dotenv | Environment config |

---

## 📁 Project Structure

```
UnitedImpact/
├── backend/
│   ├── controllers/        # Business logic
│   │   ├── campaignController.js
│   │   ├── ngoController.js
│   │   ├── razorpayController.js
│   │   └── userController.js
│   ├── middleware/          # Auth and role guards
│   │   ├── auth.js
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── models/             # Mongoose schemas
│   │   ├── Campaign.js
│   │   ├── Donation.js
│   │   ├── Message.js
│   │   ├── Ngo.js
│   │   └── User.js
│   ├── routes/             # Express routers
│   │   ├── admin.js
│   │   ├── campaigns.js
│   │   ├── donations.js
│   │   ├── messages.js
│   │   ├── ngos.js
│   │   ├── razorpay.js
│   │   ├── reports.js
│   │   └── users.js
│   ├── lib/                # Firebase admin init, Socket.IO
│   └── index.js            # Server entry point
│
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── RoleSelectionModal.jsx
│       │   ├── ThemeToggle.jsx
│       │   └── admin/
│       ├── contexts/       # AuthContext + useAuth hook
│       └── pages/
│           ├── LandingPage.jsx
│           ├── DashboardPage.jsx
│           ├── CampaignsPage.jsx
│           ├── CampaignDetails.jsx
│           ├── CreateCampaignPage.jsx
│           ├── DonationPage.jsx
│           ├── ImpactReportPage.jsx
│           ├── AchievementsPage.jsx
│           ├── NgoProfilePage.jsx
│           ├── NgoVolunteersPage.jsx
│           ├── MessagesPage.jsx
│           ├── ProfilePage.jsx
│           ├── SettingsPage.jsx
│           └── admin/
│               ├── AdminDashboardPage.jsx
│               ├── AdminVerificationPage.jsx
│               ├── AllUsersPage.jsx
│               └── AdminAnalyticsPage.jsx
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project (Auth + Admin SDK)
- Razorpay account

### 1. Clone the repo

```bash
git clone https://github.com/AkshatKardak/UnitedImpact.git
cd UnitedImpact
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/unitedimpact
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional
ADMIN_SECRET_KEY=your-admin-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

```bash
node index.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123456:web:abc
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

```bash
npm run dev
```

App runs at `http://localhost:5173` ✅

---

## 🌐 API Routes

### Public
- `GET /api/stats` — Landing page stats
- `GET /api/stats/landing` — Detailed landing stats
- `GET /api/campaigns` — List approved campaigns
- `GET /api/campaigns/:id` — Campaign detail
- `GET /api/ngos` — List verified NGOs
- `GET /api/ngos/:id` — NGO profile

### Auth Required
- `POST /api/users/register` — Register user
- `POST /api/users/google-sync` — Sync Google auth
- `GET /api/users/me` — Get profile
- `PUT /api/users/me` — Update profile

### Donor
- `GET /api/donations/my` — Donation history
- `POST /api/razorpay/create-order` — Create payment
- `POST /api/razorpay/verify` — Verify payment
- `GET /api/reports/:campaignId` — Impact report

### NGO
- `POST /api/ngos/register` — Register NGO
- `POST /api/campaigns` — Create campaign
- `PATCH /api/campaigns/:id` — Edit campaign
- `PATCH /api/campaigns/:id/volunteer/:uid/status` — Approve volunteer

### Volunteer
- `POST /api/campaigns/:id/volunteer` — Apply to volunteer
- `GET /api/donations/volunteer/stats` — Volunteer stats

### Admin
- `GET /api/admin/dashboard` — Platform-wide stats
- `PATCH /api/admin/verify-ngo/:uid` — Approve/reject NGO
- `PATCH /api/campaigns/:id/status` — Approve/reject campaign
- `GET /api/users/admin/all-users` — All users list

---

## 🌱 Seed Data

```bash
cd backend
node seedNGOs.js
node seedCampaigns.js
```

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AkshatKardak">
        <img src="https://avatars.githubusercontent.com/u/176505472?v=4" width="80px;" alt="Akshat"/><br />
        <b>AkshatKardak</b>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/GauravGirkar">
        <img src="https://github.com/GauravGirkar.png" width="80px;" alt="Gaurav"/><br />
        <b>GauravGirkar</b>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/pratikkamble2004">
        <img src="https://github.com/pratikkamble2004.png" width="80px;" alt="Pratik"/><br />
        <b>pratikkamble2004</b>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/TickleFuse09">
        <img src="https://github.com/TickleFuse09.png" width="80px;" alt="Varad"/><br />
        <b>TickleFuse09</b>
      </a>
    </td>
  </tr>
</table>

---

## 📄 License

MIT — Free to use for educational purposes.
