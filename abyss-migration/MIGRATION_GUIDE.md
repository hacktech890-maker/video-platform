## 🚀 Complete Migration Guide: Streamtape → Abyss.to

# ⚠️ IMPORTANT: Read This First

This guide is for **LIVE PRODUCTION** deployment on Netlify + Render.  
Follow steps **in order** to avoid downtime.

---

## 📋 Pre-Migration Checklist

Before starting:
- [ ] Backup your current `.env` files (locally)
- [ ] Note your current Render backend URL
- [ ] Note your current Netlify frontend URL
- [ ] Have Abyss.to account ready
- [ ] Have Abyss.to API key: `2ce5472bb6faa900b747eeaf65012a18`
- [ ] GitHub repository access
- [ ] 30 minutes of uninterrupted time

---

## 🔐 PART 1: Environment Variables Setup

### Step 1.1: Update Backend Environment (Render)

1. **Go to Render Dashboard**
2. **Click your backend service**
3. **Navigate to**: Environment tab
4. **DELETE these variables**:
   ```
   STREAMTAPE_API_USER
   STREAMTAPE_API_PASS
   ```

5. **ADD these new variables**:
   ```
   ABYSS_API_KEY=2ce5472bb6faa900b747eeaf65012a18
   ABYSS_API_BASE_URL=https://api.abyss.to
   ```

6. **Keep these existing variables**:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app.netlify.app,http://localhost:3000
   PORT=5000
   ```

7. **Click "Save Changes"**
   - ⚠️ This will trigger a redeploy - that's expected

---

### Step 1.2: Frontend Environment (Netlify)

**No changes needed** - frontend uses backend API URL which stays the same.

Verify existing variable:
```
REACT_APP_API_URL=https://your-backend-api.onrender.com/api
```

---

## 🔧 PART 2: Backend Code Changes

### Step 2.1: Files to DELETE

In your repository, delete:
```bash
backend/streamtapeService.js  # DELETE THIS FILE ENTIRELY
```

### Step 2.2: Files to ADD

Create new file: `backend/abyssService.js`

**Copy the entire content from the provided file.**

### Step 2.3: Files to REPLACE

Replace: `backend/server.js`

**Key changes**:
1. Line 7: `const abyssService = require('./abyssService');` (was streamtapeService)
2. Upload endpoint: Now uses `abyssService.uploadVideo()`
3. Embed URLs: Now uses `abyssService.getEmbedUrl()`
4. File size limit: 10GB (was 2GB)

**Copy the entire updated server.js file.**

### Step 2.4: Update .env.example

Replace: `backend/.env.example`

Shows Abyss.to configuration instead of Streamtape.

### Step 2.5: Deploy Backend

```bash
# Commit backend changes
git add backend/
git commit -m "feat: migrate from Streamtape to Abyss.to"
git push origin main
```

**Render will auto-deploy** (~3-5 minutes)

### Step 2.6: Verify Backend

1. Wait for Render deployment to complete
2. Visit: `https://your-backend-api.onrender.com/api/health`
3. **Expected response**:
   ```json
   {
     "status": "ok",
     "message": "Video platform API is running (Abyss.to)",
     "environment": "production",
     "abyssQuota": {
       "storageUsage": 0,
       "storageLimit": 1125899906842624,
       "dailyUploadRemaining": 107374182400
     }
   }
   ```

4. **If you see this** → Backend migration successful ✅

---

## 🎨 PART 3: Frontend Code Changes

### Step 3.1: Files to UPDATE

**File**: `frontend/src/services/videoService.js`

**Change**: Line 66
```javascript
// OLD:
return `https://streamtape.com/e/${fileCode}`;

// NEW:
return `https://abyss.to/embed/${fileCode}`;
```

**Copy the entire updated videoService.js file.**

### Step 3.2: Update Upload Page Text (Optional)

**File**: `frontend/src/pages/Upload.js`

Find and replace UI text:

1. Line ~130: `"Streamtape File Code *"` → `"Abyss.to File ID *"`
2. Line ~136: `"e.g., abc123xyz"` → `"e.g., ltJEfKQxR"`
3. Line ~140: `"Enter the file code from an existing Streamtape video"` → `"Enter the file ID from an existing Abyss.to video"`

**Note**: Functional code (thumbnail, duration detection) stays the same.

### Step 3.3: Add Ads to Pages

#### Home Page with Ads

**Replace**: `frontend/src/pages/Home.js`
**Replace**: `frontend/src/styles/Home.css`

**New features**:
- Left sidebar ad (300x600)
- Right sidebar ad (300x600)
- Content grid stays centered
- Responsive: hides ads on tablets/mobile

#### Watch Page with Ads

**Replace**: `frontend/src/pages/Watch.js`
**Replace**: `frontend/src/styles/Watch.css`

**New features**:
- Right sidebar ad (300x600)
- Second ad unit (300x250)
- Video player stays responsive
- Ads hide on tablets/mobile

### Step 3.4: Deploy Frontend

```bash
# Commit frontend changes
git add frontend/
git commit -m "feat: update for Abyss.to + add ad placements"
git push origin main
```

**Netlify will auto-deploy** (~2-4 minutes)

### Step 3.5: Verify Frontend

1. Wait for Netlify deployment to complete
2. Visit: `https://your-app.netlify.app`
3. **Check**:
   - ✅ Site loads without errors
   - ✅ No CORS errors in console
   - ✅ Ads appear on homepage (left/right sidebars)
   - ✅ Ads appear on watch page (right sidebar)

---

## 📢 PART 4: Adding Your Actual Ads

### Where to Add Ad Code

**Homepage** (`frontend/src/pages/Home.js`):

Line ~32-42 (Left sidebar):
```jsx
<div className="ad-placeholder">
  {/* REPLACE THIS with your actual ad code */}
  {/* Example: Google AdSense */}
  <ins className="adsbygoogle"
       style={{display:'block'}}
       data-ad-client="ca-pub-XXXXXXXXX"
       data-ad-slot="XXXXXXXXX"
       data-ad-format="auto"></ins>
  <script>
    (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
```

Line ~58-68 (Right sidebar) - same format

**Watch Page** (`frontend/src/pages/Watch.js`):

Line ~112-122 (Right sidebar - top ad):
```jsx
<div className="ad-placeholder">
  {/* PASTE YOUR AD CODE HERE */}
</div>
```

Line ~127-132 (Right sidebar - bottom ad):
```jsx
<div className="ad-placeholder" style={{ height: '250px' }}>
  {/* PASTE YOUR AD CODE HERE */}
</div>
```

### Ad Network Examples

#### Google AdSense:
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXX"
     data-ad-slot="XXXXXXXXX"
     data-ad-format="auto"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

#### Affiliate Banner:
```html
<a href="https://affiliate-link.com" target="_blank">
  <img src="banner-300x600.jpg" alt="Ad" />
</a>
```

#### Custom Ad Network:
```html
<div id="ad-unit-123"></div>
<script src="https://ad-network.com/script.js"></script>
```

### After Adding Ads:

```bash
git add frontend/src/pages/
git commit -m "feat: add production ad codes"
git push origin main
```

Netlify will redeploy with your actual ads.

---

## ✅ PART 5: Post-Migration Testing

### Test 1: Upload New Video (Abyss.to)

1. Go to your site → Click "Upload"
2. Select a small MP4 file (~5MB)
3. Enter title, wait for thumbnail/duration detection
4. Click "Upload Video"
5. **Expected**:
   - Upload progress shows
   - Redirect to home page
   - Video appears in grid
   - Can click and watch

### Test 2: Add Existing Abyss.to Video

1. Upload a video directly to Abyss.to dashboard
2. Note the file ID (e.g., `ltJEfKQxR`)
3. On your site: Click "Upload" → "Add by Code"
4. Enter file ID and title
5. Click "Add Video"
6. **Expected**:
   - Video appears on home page
   - Can click and watch

### Test 3: Video Playback

1. Click any video card
2. **Expected**:
   - Watch page loads
   - Abyss.to embed player shows
   - Video auto-plays
   - Ads show on right sidebar
   - No console errors

### Test 4: Responsive Ads

1. Resize browser window
2. **Expected**:
   - Desktop (>1400px): Both sidebars visible
   - Tablet (1024-1400px): Right sidebar only
   - Mobile (<1024px): No sidebars, content full width

---

## 🐛 Troubleshooting

### Issue 1: "ABYSS_API_KEY not set"

**Solution**:
1. Go to Render → Your service → Environment
2. Add `ABYSS_API_KEY=2ce5472bb6faa900b747eeaf65012a18`
3. Save and wait for redeploy

### Issue 2: Video uploads fail

**Check**:
1. Abyss.to quota: Visit backend `/api/health` - check `abyssQuota`
2. File size: Must be under 10GB
3. Backend logs: Render → Logs tab

### Issue 3: Embed doesn't load

**Check**:
1. File ID is correct (from Abyss.to)
2. Embed URL format: `https://abyss.to/embed/{fileId}`
3. Browser console for errors

### Issue 4: Ads don't show

**Check**:
1. Replaced `ad-placeholder` with actual ad code
2. Ad network script loaded (check network tab)
3. Window width >1024px (ads hide on mobile)

### Issue 5: Old Streamtape videos

**What happens**:
- Old videos with Streamtape file_codes will break
- Database is in-memory (resets on restart)

**Solution**:
- Start fresh after migration
- Or migrate to real database and update file_codes manually

---

## 📊 Migration Completion Checklist

- [ ] Backend environment variables updated (Render)
- [ ] Backend code deployed (Abyss.to integration)
- [ ] Backend health check shows Abyss.to quota
- [ ] Frontend code deployed (embed URL updated)
- [ ] Ads added to homepage (left + right)
- [ ] Ads added to watch page (right sidebar)
- [ ] Test upload works
- [ ] Test playback works
- [ ] No console errors
- [ ] Mobile responsive works

---

## 🎯 What Changed (Summary)

### Backend:
- ❌ Removed: `streamtapeService.js`
- ✅ Added: `abyssService.js`
- ✅ Updated: `server.js` (Abyss.to integration)
- ✅ Updated: `.env.example`
- 🔐 Changed: Environment variables

### Frontend:
- ✅ Updated: `videoService.js` (embed URL)
- ✅ Updated: `Home.js` (added ad sidebars)
- ✅ Updated: `Home.css` (ad layouts)
- ✅ Updated: `Watch.js` (added ad sidebar)
- ✅ Updated: `Watch.css` (ad layouts)
- ✅ Updated: `Upload.js` (UI text only)

### Features Kept:
- ✅ Smart thumbnail generation (browser-side)
- ✅ Auto-duration detection
- ✅ Manual fallbacks
- ✅ Production-safe deployment
- ✅ Responsive design

### New Features:
- ✅ Abyss.to video hosting (10GB uploads)
- ✅ Ad monetization (homepage + watch page)
- ✅ Responsive ad layouts

---

## 🚀 You're Done!

Your video platform is now:
- ✅ Using Abyss.to for video hosting
- ✅ Monetized with ad placements
- ✅ Production-deployed on Netlify + Render
- ✅ Ready for traffic

**Next steps**:
1. Upload videos to Abyss.to
2. Add real ad codes (replace placeholders)
3. Monitor Abyss.to quota
4. Consider adding real database for persistence

Congratulations! 🎉
