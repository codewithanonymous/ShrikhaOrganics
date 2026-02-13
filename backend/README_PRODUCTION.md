# Production Deployment Guide

## 🚀 Production-Ready Structure

```
backend/
├── server.js              # Main server file
├── routes/                # API routes
├── controllers/           # Route controllers  
├── middleware/            # Express middleware
├── uploads/               # Product images & files
├── public/                # Built frontend files
│   ├── index.html         # Main website
│   ├── style.css          # Main styles
│   ├── products.css       # Product styles
│   ├── contact.css        # Contact styles
│   ├── testimonials.css   # Testimonials styles
│   ├── founders.css       # Founders styles
│   ├── script.js          # Frontend JavaScript
│   ├── assets/            # Images, fonts, etc.
│   └── forms.html         # Contact forms
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README_PRODUCTION.md  # This file
```

## 📦 Deployment Steps

### 1. Install Dependencies
```bash
cd backend
npm install --production
```

### 2. Environment Setup
Copy `.env.example` to `.env` and update for production:
```bash
cp .env.example .env
```

Update `.env` for production:
```env
# Database Configuration
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=shreyaweb_production
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_key_for_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production
```

### 3. Build & Start
```bash
# Start the server
npm start

# Or use PM2 for production
pm2 start server.js --name "shrikha-organics"
```

## 🌐 Access Points

Once deployed, your application will be available at:

- **Main Website**: `http://your-domain.com/`
- **Admin Login**: `http://your-domain.com/admin-login`
- **Admin Dashboard**: `http://your-domain.com/admin`
- **API Endpoints**: `http://your-domain.com/api/*`
- **Product Images**: `http://your-domain.com/uploads/*`

## 🔧 Server Configuration

### Static File Serving
- Frontend files served from `/public`
- Upload files served from `/uploads`
- All routes handled by single server instance

### API Routes
- `GET /api/products/public` - Public products
- `POST /api/auth/login` - Admin authentication
- `GET /api/users/profile` - User profiles
- `POST /api/products` - Product management (admin)

### Frontend Routes
- `GET /` - Main website (catch-all)
- `GET /admin` - Admin dashboard
- `GET /admin-login` - Admin login page

## 🛡️ Security Notes

1. **Environment Variables**: Never commit `.env` file
2. **Database**: Use strong, unique passwords
3. **JWT Secret**: Use long, random strings
4. **HTTPS**: Enable SSL in production
5. **File Uploads**: Validate file types and sizes
6. **Rate Limiting**: Implement API rate limiting

## 📊 Performance

1. **Static Files**: Served efficiently by Express
2. **Images**: Optimized and cached
3. **CSS/JS**: Minified in production
4. **Database**: Use connection pooling
5. **CDN**: Consider CDN for static assets

## 🔄 Development vs Production

| Development | Production |
|-------------|------------|
| Frontend in `/frontend` | Frontend in `/public` |
| Multiple servers | Single server instance |
| CORS enabled | CORS configured for domain |
| Hot reload | Static file serving |
| Dev database | Production database |

## 🚦 Health Checks

Monitor these endpoints:
- `GET /` - Website accessibility
- `GET /api/products/public` - API functionality
- Database connection status
- File upload directory permissions

## 📝 Maintenance

1. **Backups**: Regular database backups
2. **Logs**: Monitor application logs
3. **Updates**: Keep dependencies updated
4. **Security**: Regular security audits
5. **Performance**: Monitor load times

---

**Ready for Production! 🎉**
