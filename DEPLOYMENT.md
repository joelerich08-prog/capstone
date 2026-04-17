# Deployment Guide for Capstone Project

## Overview
This guide covers the deployment process for the Kakai's Kutkutin Wholesale & Retail System.

## Prerequisites
- Node.js 18+ and npm/pnpm
- PHP 8.1+ with MySQL extension
- MySQL 8.0+
- Apache/Nginx web server
- SSL certificate (recommended for production)

## Environment Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local` (development) or `.env.production` (production):

```bash
cp .env.example .env.local
```

Update the following variables for your environment:

```env
# Database Configuration
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASS=your-database-password

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# CORS Origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 2. Database Setup
1. Create a MySQL database
2. Import the schema: `mysql -u username -p database_name < schema.sql`
3. Import seed data: `mysql -u username -p database_name < seed_all_demo.sql`

### 3. PHP Backend Deployment
1. Ensure PHP files are accessible via web server
2. Configure Apache/Nginx to serve PHP files
3. Set proper file permissions (755 for directories, 644 for files)
4. Ensure `config/db.php` can read environment variables

### 4. Next.js Frontend Deployment
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the application:
   ```bash
   pnpm run build
   ```

3. Start the production server:
   ```bash
   pnpm start
   ```

## Web Server Configuration

### Apache (.htaccess)
Create `.htaccess` in the `/api` directory:

```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### Nginx Configuration
Add to your server block:

```
location /api {
    try_files $uri $uri/ /api/index.php?$query_string;
}

location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

## Security Considerations

### 1. Database Security
- Use strong passwords
- Restrict database user privileges
- Use SSL for database connections

### 2. Environment Variables
- Never commit `.env.local` or `.env.production` to version control
- Use different credentials for development and production
- Rotate credentials regularly

### 3. File Permissions
- PHP files: 644
- Directories: 755
- Sensitive files (config): 600

### 4. HTTPS
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use secure cookies

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check environment variables
   - Verify database credentials
   - Ensure MySQL server is running

2. **CORS Errors**
   - Update `CORS_ALLOWED_ORIGINS` in environment variables
   - Check if origin includes protocol and port

3. **API 404 Errors**
   - Verify API URL configuration
   - Check web server rewrite rules
   - Ensure PHP files are executable

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## Monitoring
- Monitor PHP error logs
- Check database connection status
- Monitor application performance
- Set up log rotation

## Backup Strategy
- Regular database backups
- File system backups
- Environment variable backups (secure location)
- Test restore procedures regularly

env.example to root

# Environment Variables for Capstone Project
# Copy this file to .env.local and fill in your production values

# Database Configuration
DB_HOST=localhost
DB_NAME=capstone_db
DB_USER=root
DB_PASS=

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost/capstone-update/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Kakai's Kutkutin Wholesale & Retail System"
NEXT_PUBLIC_APP_VERSION=1.0.0

# CORS Origins (comma-separated for multiple origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

env.local to root

# Development Environment Variables
# This file is for local development only

# Database Configuration
DB_HOST=localhost
DB_NAME=capstone_db
DB_USER=root
DB_PASS=

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost/capstone-update/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Kakai's Kutkutin Wholesale & Retail System"
NEXT_PUBLIC_APP_VERSION=1.0.0

# CORS Origins (comma-separated for multiple origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

htaccess to api folder

RewriteEngine On

# Handle PHP API endpoints
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\.(env|git|htaccess|htpasswd)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>