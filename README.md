# Discount Server

Backend server for the Discount Website project.

## Tech Stack

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- Firebase Admin
- VNPay Payment Integration

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn
- Firebase account
- VNPay merchant account

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/nhnhien/discount_server.git
cd discount_server
```

### 2. Database Setup
1. Download the database file from [Google Drive](https://drive.google.com/file/d/1JnecOi4f_2_SlLlt9ZgRiYsKGMepRktP/view?usp=drive_link)
2. Import the SQL file into your MySQL database:
```bash
mysql -u your_username -p your_database_name < path_to_downloaded_file.sql
```

### 3. Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database credentials
DB_NAME="discount"
DB_USER="your_mysql_username"
DB_PASSWORD="your_mysql_password"
DB_HOST="127.0.0.1"
DB_DIALECT=mysql
DB_PORT=3306

VNPAY_RETURN_URL=http://localhost:8005/api/payment/vnpay-return
BACKEND_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173

# Initialize database
npm run db-init

# Start development server
npm run start:dev
```

## Firebase Configuration

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Authentication and select Email/Password sign-in method

### 2. Get Firebase Admin SDK
1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccount.json` in `src/data/`

### 3. Update Firebase Config
In `src/config/firebase.config.js`:
```javascript
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```

## VNPay Configuration

### 1. Register VNPay Merchant Account
1. Go to [VNPay Merchant Portal](https://sandbox.vnpayment.vn/merchantv2/)
2. Register for a merchant account
3. Get your TMN_CODE and SECURE_SECRET

### 2. Update VNPay Config
In `src/config/vnpay.config.js`:
```javascript
const vnpay = new VNPay({
  tmnCode: 'YOUR_TMN_CODE',
  secureSecret: 'YOUR_SECURE_SECRET',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true, // Set to false for production
  hashAlgorithm: 'SHA512',
  enableLog: false,
});
```

### 3. Configure Return URL
1. Update `VNPAY_RETURN_URL` in `.env` to match your application's payment callback URL
2. For development: `http://localhost:8005/api/payment/vnpay-return`
3. For production: `https://your-domain.com/api/payment/vnpay-return`

## Available Scripts

- `npm run start:dev` - Start development server
- `npm run db-init` - Initialize database (drop, create, migrate, seed)
- `npm run db-migrate` - Run database migrations
- `npm run db-seed` - Seed database with initial data

## API Endpoints

- Authentication: `/api/auth/*`
- Products: `/api/products/*`
- Categories: `/api/categories/*`
- Orders: `/api/orders/*`
- Payments: `/api/payment/*`
- Users: `/api/users/*`

## Important Notes

1. Make sure MySQL is running before starting the server
2. Server runs on port 8000 by default
3. Keep your Firebase service account key and VNPay credentials secure
4. Test VNPay integration in sandbox mode before going to production
5. Update VNPay configuration for production environment

## Support

For any issues or questions, please create an issue in the [repository](https://github.com/nhnhien/discount_server).
