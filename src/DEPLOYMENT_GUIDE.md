# QuickFuel Deployment Guide

Complete guide for deploying QuickFuel to production.

## Pre-Deployment Checklist

### Development Complete
- [ ] All features tested in mock mode
- [ ] All features tested with Supabase
- [ ] No console errors
- [ ] Mobile responsive design verified
- [ ] Cross-browser testing done (Chrome, Firefox, Safari)
- [ ] Performance optimized
- [ ] Security review completed

### Database Ready
- [ ] Supabase production project created
- [ ] Database schema applied
- [ ] Initial fuel prices set
- [ ] RLS policies enabled and tested
- [ ] Indexes verified
- [ ] Backup strategy configured

### Environment Configuration
- [ ] Production .env configured
- [ ] API keys secured
- [ ] CORS configured properly
- [ ] Email templates customized
- [ ] Auth redirects configured

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel offers zero-config deployment with automatic builds and deployments.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Project**
   Create `vercel.json` in project root:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "env": {
       "VITE_SUPABASE_URL": "@supabase-url",
       "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
     }
   }
   ```

4. **Add Environment Variables**
   ```bash
   # Via Vercel dashboard or CLI
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   ```

5. **Deploy**
   ```bash
   # First deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

6. **Set Up Continuous Deployment**
   - Connect GitHub repository in Vercel dashboard
   - Enable automatic deployments on push
   - Configure production branch (usually `main`)

#### Vercel Configuration

**Advantages:**
- ✅ Zero-config setup
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for pull requests
- ✅ Free tier available

**Post-Deployment:**
- Configure custom domain
- Set up environment variables
- Enable automatic deployments

### Option 2: Netlify

Another excellent choice for static site deployment.

#### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [build.environment]
     NODE_VERSION = "18"
   ```

4. **Deploy**
   ```bash
   # Test deployment
   netlify deploy
   
   # Production deployment
   netlify deploy --prod
   ```

5. **Set Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add: `VITE_SUPABASE_URL`
   - Add: `VITE_SUPABASE_ANON_KEY`

### Option 3: AWS S3 + CloudFront

For enterprise-grade hosting with full control.

#### Steps:

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://quickfuel-production
   ```

3. **Configure Bucket for Static Hosting**
   ```bash
   aws s3 website s3://quickfuel-production \
     --index-document index.html \
     --error-document index.html
   ```

4. **Upload Files**
   ```bash
   aws s3 sync dist/ s3://quickfuel-production --delete
   ```

5. **Set Up CloudFront**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom error pages
   - Set up SSL certificate
   - Configure caching rules

6. **Configure Environment Variables**
   - Use AWS Systems Manager Parameter Store
   - Or build with environment variables baked in

### Option 4: DigitalOcean App Platform

Simple PaaS deployment with built-in database support.

#### Steps:

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Select branch

2. **Configure Build**
   ```yaml
   name: quickfuel
   services:
   - name: web
     github:
       repo: your-username/quickfuel
       branch: main
     build_command: npm run build
     run_command: npm run preview
     envs:
     - key: VITE_SUPABASE_URL
       value: ${SUPABASE_URL}
     - key: VITE_SUPABASE_ANON_KEY
       value: ${SUPABASE_ANON_KEY}
   ```

3. **Set Environment Variables**
   - Add in App Platform dashboard
   - Or use `.env` file in repo (not recommended)

4. **Deploy**
   - Automatic deployment on push
   - Or manual deploy via dashboard

## Supabase Production Setup

### 1. Create Production Project

1. Go to https://app.supabase.com
2. Create new project
3. Choose production-grade settings:
   - **Region**: Closest to your users (Frankfurt for Ethiopia)
   - **Plan**: Pro plan recommended for production
   - **Database Password**: Strong, unique password
   - **Enable Database Backups**: Yes

### 2. Apply Database Schema

```bash
# Copy schema to clipboard
cat database/schema.sql | pbcopy  # Mac
cat database/schema.sql | clip    # Windows

# Paste in Supabase SQL Editor and run
```

### 3. Configure Authentication

1. **Email Auth**
   - Enable email authentication
   - Customize email templates
   - Set redirect URLs

2. **Rate Limiting**
   ```sql
   -- Limit sign-ups per hour
   ALTER DATABASE postgres SET app.rate_limit_signup = '10/hour';
   ```

3. **Security**
   - Enable CAPTCHA for sign-up (optional)
   - Configure password requirements
   - Set session timeout

### 4. Set Up Monitoring

1. **Enable Logging**
   - Go to Logs section
   - Enable query logs
   - Enable auth logs

2. **Set Up Alerts**
   - Configure alerts for errors
   - Monitor database size
   - Track API usage

3. **Performance Monitoring**
   - Check slow query log
   - Monitor connection pool
   - Track API response times

### 5. Configure Backups

- Enable daily backups (included in Pro plan)
- Test restore procedure
- Document backup schedule

## Security Configuration

### 1. Environment Variables

Never commit `.env` to version control:

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. CORS Configuration

In Supabase dashboard:
1. Go to Settings → API
2. Add your production domain to CORS allowed origins
3. Example: `https://quickfuel.com`

### 3. Rate Limiting

Implement rate limiting for API calls:

```typescript
// In your service layer
const RATE_LIMIT = 100; // requests per minute
const rateLimiter = new Map();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(
    time => now - time < 60000
  );
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

### 4. Content Security Policy

Add CSP headers in your hosting provider:

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://*.supabase.co;
```

## Performance Optimization

### 1. Build Optimization

```json
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 2. Enable Compression

Most hosting providers enable this by default, but verify:
- Gzip compression
- Brotli compression (better than gzip)

### 3. Cache Configuration

```javascript
// In hosting provider
Cache-Control: public, max-age=31536000, immutable  // For assets
Cache-Control: no-cache, must-revalidate            // For index.html
```

### 4. Image Optimization

Use Supabase Storage with image transformations:
- Resize images on-the-fly
- Convert to WebP
- Lazy load images

## Monitoring & Analytics

### 1. Error Tracking

Install Sentry for error tracking:

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// In App.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### 2. Analytics

Add analytics (Google Analytics, Plausible, etc.):

```typescript
// In App.tsx
import { analytics } from './lib/analytics';

useEffect(() => {
  analytics.page();
}, [location]);
```

### 3. Performance Monitoring

Use Vercel Analytics or Web Vitals:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics';
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Post-Deployment

### 1. Smoke Testing

Test critical paths:
- [ ] User registration
- [ ] User login
- [ ] Create reservation
- [ ] Update fuel stock
- [ ] Admin operations
- [ ] Payment flow
- [ ] QR code generation

### 2. Load Testing

Use tools like:
- Apache Bench
- k6
- Artillery

```bash
# Example with Apache Bench
ab -n 1000 -c 10 https://quickfuel.com/api/stations
```

### 3. Security Scan

Run security scans:
- OWASP ZAP
- Snyk
- npm audit

```bash
npm audit
npm audit fix
```

### 4. Accessibility Check

- Run Lighthouse audit
- Test with screen readers
- Verify keyboard navigation
- Check color contrast

## Rollback Plan

### If Issues Arise

1. **Immediate Rollback**
   ```bash
   # Vercel
   vercel rollback
   
   # Netlify
   netlify deploy --alias previous-version
   
   # Manual
   # Redeploy previous working commit
   ```

2. **Database Rollback**
   ```sql
   -- Restore from Supabase backup
   -- Go to Database → Backups → Restore
   ```

3. **DNS Rollback**
   - Point domain back to old server
   - Wait for DNS propagation (can take hours)

## Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check API usage
- [ ] Review slow queries

### Weekly
- [ ] Check database size
- [ ] Review user feedback
- [ ] Update dependencies

### Monthly
- [ ] Full security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Cost optimization review

## Cost Optimization

### Supabase
- Start with Pro plan ($25/month)
- Monitor database size
- Archive old data
- Optimize queries

### Hosting
- Vercel: Free for personal, $20/month for teams
- Netlify: Similar pricing
- AWS: Pay per use (typically $5-50/month)

### Estimated Monthly Costs
- Hosting: $0-50
- Supabase: $25-100
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- **Total**: ~$35-150/month

## Support & Maintenance

### Documentation
- Keep README.md updated
- Document API changes
- Maintain changelog

### User Support
- Set up support email
- Create FAQ section
- Add in-app help

### Backup & Disaster Recovery
- Daily database backups
- Weekly full backups
- Test restore procedures monthly
- Keep backup of .env files (encrypted)

## Production Checklist

Final checklist before go-live:

### Technical
- [ ] All tests passing
- [ ] No console errors
- [ ] Build successful
- [ ] Environment variables set
- [ ] Database schema applied
- [ ] RLS policies enabled
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Custom domain configured

### Security
- [ ] Auth working properly
- [ ] RLS policies tested
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Sensitive data encrypted
- [ ] Security headers set

### Performance
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Caching configured
- [ ] CDN enabled
- [ ] Load testing done

### Monitoring
- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Logs enabled
- [ ] Alerts set up
- [ ] Uptime monitoring

### Business
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Contact information
- [ ] Support email
- [ ] Backup plan

---

## Quick Deploy Commands

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### AWS S3
```bash
npm run build
aws s3 sync dist/ s3://quickfuel-production --delete
```

---

**Deployment Status**: Ready for Production ✅  
**Last Updated**: March 3, 2026

**Need help?** Contact the development team or refer to platform documentation.
