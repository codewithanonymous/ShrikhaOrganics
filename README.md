# Shrikha Organics Admin Panel

A complete full-stack admin panel for managing products and users in the Shrikha Organics e-commerce website.

## Features

- **Authentication**: Secure admin login with JWT tokens
- **Product Management**: Add, edit, delete products with image uploads
- **User Management**: View all registered users
- **Modern UI**: Responsive design with Shrikha Organics branding
- **Security**: Password hashing, protected routes, role-based access

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Multer (file uploads)
- bcryptjs (password hashing)

### Frontend
- HTML5
- CSS3 with modern design
- Vanilla JavaScript
- Responsive design

## Folder Structure

```
backend/
├── server.js              # Main server file
├── db.js                 # Database connection
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── products.js      # Product management routes
│   └── users.js         # User management routes
└── middleware/
    └── auth.js          # JWT middleware

frontend/
├── admin.html           # Admin dashboard
├── admin-login.html     # Login page
├── admin.css           # Styles
├── admin.js            # Dashboard functionality
└── admin-login.js      # Login functionality

uploads/                 # Product images (auto-created)
```

## Setup Instructions

### 1. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shreyaweb;

# Exit and run the setup script
\q
psql -U postgres -d shreyaweb -f setup.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 3. Environment Variables (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sheryaweb
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
```

### 4. Run the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Users
- `GET /api/users` - Get all users (admin only)

## Default Admin Credentials

- **Email**: admin@shrikhaorganics.com
- **Password**: admin123

⚠️ **Important**: Change the default admin password immediately after first login!

## Usage

1. Start the server: `npm start`
2. Open browser: `http://localhost:5000/admin-login`
3. Login with admin credentials
4. Manage products and users from the dashboard

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected admin routes
- File upload validation
- SQL injection prevention

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure HTTPS
4. Set up proper database backups
5. Configure CORS for your domain
6. Use environment variables for all secrets

## File Upload

- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB
- Images stored in `/uploads` directory
- Automatic old image cleanup on product update/delete

## Database Schema

### Database
- `shreyaweb`

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR UNIQUE)
- `password` (VARCHAR - hashed)
- `role` (VARCHAR - default 'user')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Products Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `price` (DECIMAL)
- `description` (TEXT)
- `image_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running
- Verify database credentials in .env
- Ensure database exists

### File Upload Issues
- Check uploads directory permissions
- Verify file size limits
- Check image format support

### Authentication Issues
- Clear browser localStorage
- Verify JWT secret is set
- Check token expiration

## License

MIT License
