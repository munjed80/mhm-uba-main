# UBA Dashboard - Deployment Guide (Vercel)

Complete guide for deploying the UBA Dashboard to production on Vercel.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment Steps](#vercel-deployment-steps)
4. [Environment Variables Setup](#environment-variables-setup)
5. [DNS & Domain Configuration](#dns--domain-configuration)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Troubleshooting](#troubleshooting)
8. [Alternative Hosting (Netlify)](#alternative-hosting-netlify)

---

## Prerequisites

**Before deploying, ensure you have:**

- [x] Completed Weeks 1-5 of MVP implementation
- [x] Supabase project created and configured
- [x] All SQL migrations run in Supabase
- [x] Tested locally with Supabase credentials
- [x] GitHub repository with all code committed
- [x] Vercel account (free tier available at vercel.com)

---

## Pre-Deployment Checklist

### 1. Code Preparation

- [ ] All files committed to Git repository
- [ ] `supabase-config.js` in `.gitignore` (DO NOT commit credentials)
- [ ] All asset paths are relative (no hardcoded `/assets/...`)
- [ ] Console logs disabled or minimized for production
- [ ] Demo mode disabled when Supabase configured

### 2. Supabase Configuration

- [ ] Database tables created (clients, projects, tasks, invoices)
- [ ] RLS policies enabled and tested
- [ ] Authentication enabled in Supabase dashboard
- [ ] Email provider configured (if using email auth)
- [ ] Supabase URL and anon key copied

### 3. Security Review

- [ ] No credentials in source code
- [ ] Input validation in place
- [ ] XSS protection implemented (security.js)
- [ ] Password requirements enforced (min 8 chars)
- [ ] Session management working correctly

---

## Vercel Deployment Steps

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

**Via CLI:**
```bash
vercel login
```

**Via Dashboard:**
- Go to https://vercel.com
- Sign up or login with GitHub account

### Step 3: Connect GitHub Repository

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`mhm-uba-main`)
4. Click "Import"

**Option B: Via CLI**

```bash
cd /path/to/mhm-uba-main
vercel
```

### Step 4: Configure Build Settings

**Framework Preset:** None (static HTML)

**Build Command:** (Leave empty - no build needed)

**Output Directory:** `.` (root directory)

**Install Command:** (Leave empty)

### Step 5: Configure Environment Variables

In Vercel dashboard, go to:
- Project Settings → Environment Variables

Add the following:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production, Preview, Development |

**Important:** These will be accessible in the browser (public API keys only).

### Step 6: Deploy

**Via Dashboard:**
- Click "Deploy" button
- Wait for deployment to complete
- Vercel will provide a URL: `https://your-project.vercel.app`

**Via CLI:**
```bash
vercel --prod
```

### Step 7: Create Production Config

Since we can't commit `supabase-config.js`, create it dynamically:

**Option A: Environment Variables in HTML**

Add to each HTML file's `<head>` section:

```html
<script>
  // Read from Vercel environment (injected at build time)
  window.SUPABASE_CONFIG = {
    url: '{{ SUPABASE_URL }}',
    anonKey: '{{ SUPABASE_ANON_KEY }}'
  };
</script>
```

**Option B: Create Config Script**

Create a new file `supabase-config-prod.js`:

```javascript
// Production config - reads from environment
window.SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || window.VERCEL_ENV_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || window.VERCEL_ENV_SUPABASE_ANON_KEY
};
```

**Option C: Use Vercel Edge Config** (Advanced)

See: https://vercel.com/docs/storage/edge-config

---

## Environment Variables Setup

### Getting Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon/public key** → `SUPABASE_ANON_KEY`

### Setting in Vercel

**Via Dashboard:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select which environments (Production, Preview, Development)
4. Click "Save"

**Via CLI:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### Testing Environment Variables

After deployment, test in browser console:

```javascript
console.log(window.SUPABASE_CONFIG);
// Should show: {url: "https://...", anonKey: "..."}
```

---

## DNS & Domain Configuration

### Using Custom Domain

**Step 1: Add Domain in Vercel**

1. Project Settings → Domains
2. Click "Add"
3. Enter your domain (e.g., `dashboard.yourcompany.com`)
4. Click "Add"

**Step 2: Configure DNS**

Add these DNS records in your domain provider:

**For root domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (dashboard.example.com):**
```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
```

**Step 3: Verify**

- Vercel will verify DNS automatically
- SSL certificate issued automatically (via Let's Encrypt)
- Wait 24-48 hours for DNS propagation

### Using Vercel Subdomain

Free option: `https://your-project.vercel.app`

No DNS configuration needed!

---

## Post-Deployment Validation

### 1. Smoke Test Checklist

- [ ] Homepage loads (index.html)
- [ ] Login page loads (login.html)
- [ ] Signup page loads (signup.html)
- [ ] Can create new account
- [ ] Can login with created account
- [ ] Dashboard loads after login
- [ ] Can navigate to Clients page
- [ ] Can navigate to Projects page
- [ ] Can navigate to Tasks page
- [ ] Can navigate to Invoices page
- [ ] Can create a new client
- [ ] Can edit a client
- [ ] Can delete a client
- [ ] Can logout
- [ ] Session persists on page reload
- [ ] Auto-redirect to login when not authenticated

### 2. Browser Console Checks

**Check for errors:**
```javascript
// Should be no errors in console
// Warnings are acceptable
```

**Verify Supabase connection:**
```javascript
console.log(window.UBAApi);
// Should show Supabase client object

await window.UBAApi.auth.getSession();
// Should show current session or null
```

**Test CRUD operations:**
```javascript
// After logging in
const client = await window.SupabaseStore.clients.create({
  name: 'Test Client',
  email: 'test@example.com'
});

const clients = await window.SupabaseStore.clients.getAll();
console.log('Total clients:', clients.length);

await window.SupabaseStore.clients.delete(client.id);
```

### 3. Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Check responsive layout
- [ ] Test touch interactions (drag/drop)
- [ ] Verify forms work on mobile keyboards

### 4. Performance Checks

**Lighthouse Audit:**
1. Open DevTools → Lighthouse
2. Run audit
3. Target scores:
   - Performance: 80+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 80+

**Page Load Times:**
- Initial load: < 3 seconds
- Subsequent pages: < 1 second
- API calls: < 500ms

### 5. Security Validation

- [ ] HTTPS enabled (SSL certificate active)
- [ ] No credentials in source code
- [ ] XSS attempts blocked
- [ ] Authentication required for protected pages
- [ ] RLS policies enforced in Supabase

---

## Cache Invalidation

### Clear Browser Cache

Users may need to clear cache after deployment:

**Chrome:**
- DevTools → Network → "Disable cache"
- Or: Ctrl+Shift+Delete → Clear cache

**Safari:**
- Develop → Empty Caches

**Firefox:**
- Ctrl+Shift+Delete → Cached Web Content

### Force Cache Invalidation

**Option 1: Add Version Query String**

```html
<link rel="stylesheet" href="assets/css/style.css?v=1.0.1">
<script src="assets/js/app.js?v=1.0.1"></script>
```

**Option 2: Vercel Headers**

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## Troubleshooting

### Issue: Blank Page After Deployment

**Causes:**
- JavaScript errors
- Missing Supabase config
- Incorrect asset paths

**Solutions:**
1. Check browser console for errors
2. Verify environment variables in Vercel
3. Ensure all paths are relative
4. Check Vercel deployment logs

### Issue: "Supabase is not defined"

**Cause:** Supabase CDN script not loaded

**Solution:**
Ensure all HTML files have:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

### Issue: 404 on Page Refresh

**Cause:** SPA routing not configured

**Solution:**
Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1.html" }
  ]
}
```

### Issue: Authentication Not Working

**Causes:**
- Supabase auth not enabled
- Wrong redirect URLs
- Email provider not configured

**Solutions:**
1. Check Supabase Dashboard → Authentication → Providers
2. Add your Vercel URL to "Site URL" and "Redirect URLs"
3. Configure email provider (or use email confirmation disabled for testing)

### Issue: Slow Performance

**Causes:**
- Large images not optimized
- Too many API calls
- No caching

**Solutions:**
1. Optimize images (WebP format, compress)
2. Implement data caching in adapter
3. Use Vercel Edge Functions for API aggregation

### Issue: CORS Errors

**Cause:** Supabase CORS not configured

**Solution:**
1. Supabase Dashboard → Settings → API
2. Add your Vercel domain to CORS allowed origins
3. Redeploy

---

## Alternative Hosting (Netlify)

### Quick Netlify Deployment

**Step 1: Connect Repository**
1. Go to https://netlify.com
2. "New site from Git" → GitHub
3. Select repository

**Step 2: Build Settings**
- Build command: (leave empty)
- Publish directory: `.`

**Step 3: Environment Variables**
- Site settings → Build & deploy → Environment
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Step 4: Deploy**
- Click "Deploy site"
- Get URL: `https://your-site.netlify.app`

### Netlify vs Vercel

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Free tier | ✅ Generous | ✅ Generous |
| Custom domains | ✅ | ✅ |
| SSL | ✅ Auto | ✅ Auto |
| Edge functions | ✅ | ✅ |
| Build time | Fast | Fast |
| CDN | Global | Global |
| Learning curve | Easy | Easy |

**Recommendation:** Either works great for this project. Vercel is slightly easier for beginners.

---

## Production Folder Structure

```
mhm-uba-main/
├── index.html              (Dashboard - protected)
├── login.html              (Public)
├── signup.html             (Public)
├── clients.html            (Protected)
├── projects.html           (Protected)
├── tasks.html              (Protected)
├── invoices.html           (Protected)
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── security.js     (Week 5)
│   │   ├── ui-helpers.js   (Week 5)
│   │   ├── auth-guard.js   (Week 4)
│   │   ├── auth-login.js   (Week 4)
│   │   ├── auth-signup.js  (Week 4)
│   │   ├── supabase-api-service.js (Week 1)
│   │   ├── supabase-store-adapter.js (Week 3)
│   │   ├── clients.js      (Week 3)
│   │   ├── projects.js     (Week 3)
│   │   ├── tasks.js        (Week 3)
│   │   └── invoices.js     (Week 3)
├── supabase/
│   ├── migrations/
│   │   ├── 20251122_001_create_tables.sql
│   │   └── 20251122_002_enable_rls.sql
│   ├── SETUP-GUIDE.md
│   └── API-REFERENCE.md
├── .gitignore
├── supabase-config.template.js
└── README.md
```

**DO NOT DEPLOY:**
- `supabase-config.js` (use environment variables instead)
- `node_modules/` (if any)
- `.git/`
- `.env` files

---

## Cost Estimate (Free Tier)

### Vercel Free Tier Limits

- Bandwidth: 100GB/month
- Builds: 6,000 minutes/month
- Serverless function execution: 100GB-hours
- Team members: 1

**Expected usage for MVP:**
- Bandwidth: < 5GB/month (estimated 100 users)
- Builds: < 100 minutes/month
- Cost: **$0/month** ✅

### Supabase Free Tier Limits

- Database: 500MB
- Storage: 1GB
- Monthly active users: Unlimited
- API requests: Unlimited

**Expected usage for MVP:**
- Database: < 50MB
- Storage: < 100MB
- Cost: **$0/month** ✅

### Total Monthly Cost

**MVP Production:** $0/month ✅

**When to upgrade:**
- Vercel: > 100GB bandwidth or need team features
- Supabase: > 500MB database or need advanced features

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Use Vercel Analytics
   - Track page load times
   - Monitor error rates

2. **Set Up Error Tracking**
   - Integrate Sentry (optional)
   - Monitor console errors
   - Track user issues

3. **Collect User Feedback**
   - Add feedback form
   - Monitor support requests
   - Track feature requests

4. **Plan Next Release**
   - Review MVP-DEVELOPMENT-PLAN.md
   - Prioritize Phase 2 features
   - Schedule updates

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** Report bugs in repository
- **Stack Overflow:** Tag questions with `vercel` or `supabase`

---

**Deployment Status:** Ready for production ✅

Follow this guide step-by-step and your UBA Dashboard will be live in under 30 minutes!
