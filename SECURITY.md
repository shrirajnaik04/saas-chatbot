# Security Guide

## 🔒 Environment Variables

This project uses environment variables to store sensitive configuration. **Never commit real credentials to version control.**

### Required Environment Variables

Create a `.env` file in the root directory with these variables:

```bash
# Together AI API Key - Get from https://api.together.xyz/
TOGETHER_API_KEY=your_actual_api_key_here

# MongoDB Connection String - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secrets - Generate random strings (use: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_here
EMBED_JWT_SECRET=your_secure_embed_jwt_secret_here

# Application URL
NEXTAUTH_URL=http://localhost:3000
```

### Generating Secure Secrets

For JWT secrets, use these commands:
```bash
# For JWT_SECRET
openssl rand -base64 32

# For EMBED_JWT_SECRET  
openssl rand -base64 32
```

## 🛡️ Security Features

- **JWT Authentication**: All API requests use signed JWT tokens
- **Domain Validation**: Chatbot embeds validate allowed domains
- **Password Hashing**: All passwords are hashed with bcryptjs
- **Environment Variables**: Sensitive data stored in .env (gitignored)
- **Token Expiration**: JWT tokens expire after 2 hours

## ⚠️ Important Notes

1. **Never commit .env files** - They're automatically ignored by git
2. **Change default secrets** - Use strong, random values in production
3. **Rotate API keys** - Regularly update API keys and JWT secrets
4. **Use HTTPS** - Always use HTTPS in production
5. **Validate domains** - Configure allowed domains for each tenant

## 🚨 If Credentials Are Compromised

1. **Immediately rotate** all API keys and secrets
2. **Update environment variables** in all environments
3. **Invalidate existing JWT tokens** by changing JWT secrets
4. **Check logs** for suspicious activity
5. **Update tenant allowed domains** if needed

## 📋 Security Checklist

- [ ] `.env` file contains no real credentials in version control
- [ ] All scripts use `process.env` instead of hardcoded values  
- [ ] JWT secrets are strong and unique
- [ ] MongoDB connection uses authentication
- [ ] API keys are from official sources
- [ ] Production uses HTTPS
- [ ] Tenant domains are properly configured
