# 📢 Ads Integration Guide

Complete guide to add advertisements to your video platform.

---

## 🎯 Overview

Your platform now has ad placements on:
1. **Homepage**: Left sidebar + Right sidebar
2. **Watch Page**: Right sidebar (2 units)

All ad layouts are **responsive** and production-ready.

---

## 📐 Ad Placement Locations

### Homepage (3-Column Layout)

```
┌────────────────────────────────────────────────┐
│  [Left Ad]   [Video Grid]   [Right Ad]        │
│   300x600      (Center)       300x600         │
└────────────────────────────────────────────────┘
```

**Desktop (>1400px)**: Shows both sidebars  
**Tablet (1024-1400px)**: Shows right sidebar only  
**Mobile (<1024px)**: Hides both sidebars

### Watch Page (2-Column Layout)

```
┌────────────────────────────────────────────────┐
│  [Video Player]              [Right Ad]        │
│  [Video Details]              300x600         │
│                               [Right Ad 2]     │
│                                300x250         │
└────────────────────────────────────────────────┘
```

**Desktop (>1024px)**: Shows right sidebar  
**Tablet/Mobile (<1024px)**: Hides sidebar

---

## 🔧 How to Add Your Ads

### Method 1: Google AdSense

#### Step 1: Get AdSense Code

1. Go to Google AdSense dashboard
2. Create new ad unit:
   - **Homepage**: Display ads, 300x600 (Large Skyscraper)
   - **Watch Page**: Display ads, 300x600 or 300x250
3. Copy the ad code

#### Step 2: Add to Homepage

**File**: `frontend/src/pages/Home.js`

**Line ~37** (Left sidebar ad):
```jsx
<div className="ad-placeholder">
  {/* REPLACE WITH: */}
  <ins className="adsbygoogle"
       style={{display:'block'}}
       data-ad-client="ca-pub-XXXXXXXXX"
       data-ad-slot="YYYYYYYYYY"
       data-ad-format="vertical"></ins>
</div>
```

**Line ~63** (Right sidebar ad):
```jsx
<div className="ad-placeholder">
  {/* REPLACE WITH: */}
  <ins className="adsbygoogle"
       style={{display:'block'}}
       data-ad-client="ca-pub-XXXXXXXXX"
       data-ad-slot="ZZZZZZZZZZ"
       data-ad-format="vertical"></ins>
</div>
```

#### Step 3: Add AdSense Script to HTML

**File**: `frontend/public/index.html`

Add before `</head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXX"
     crossorigin="anonymous"></script>
```

#### Step 4: Initialize Ads in Component

**File**: `frontend/src/pages/Home.js`

Add after imports:
```javascript
import { useEffect } from 'react';

// Inside Home component, after state declarations:
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (err) {
    console.error('AdSense error:', err);
  }
}, []);
```

---

### Method 2: Affiliate Banners

#### Example: Amazon Associates

**File**: `frontend/src/pages/Home.js`

**Line ~37** (Left sidebar):
```jsx
<div className="ad-placeholder">
  <a href="https://amazon.com/your-affiliate-link" target="_blank" rel="noopener noreferrer">
    <img 
      src="/banners/amazon-300x600.jpg" 
      alt="Shop on Amazon"
      style={{width: '100%', height: 'auto'}}
    />
  </a>
</div>
```

**Place banner images** in `frontend/public/banners/`

---

### Method 3: Custom Ad Network

#### Example: Media.net, PropellerAds, etc.

**File**: `frontend/src/pages/Home.js`

**Line ~37**:
```jsx
<div className="ad-placeholder">
  {/* Custom ad network code */}
  <div id="custom-ad-unit-123"></div>
</div>
```

**File**: `frontend/public/index.html`

Add before `</body>`:
```html
<script>
  // Custom ad network initialization
  (function() {
    var script = document.createElement('script');
    script.src = 'https://ad-network.com/ads.js';
    document.body.appendChild(script);
  })();
</script>
```

---

### Method 4: Video Ads (Watch Page)

#### Example: Pre-roll video ads

**File**: `frontend/src/pages/Watch.js`

**Line ~117**:
```jsx
<div className="ad-placeholder">
  {/* Video ad player */}
  <div id="video-ad-container"></div>
  <script src="https://video-ad-network.com/player.js"></script>
  <script>
    videoAdNetwork.init({
      containerId: 'video-ad-container',
      adUnitId: 'YOUR_AD_UNIT_ID'
    });
  </script>
</div>
```

---

## 🎨 Customizing Ad Containers

### Change Ad Size

**File**: `frontend/src/styles/Home.css` or `Watch.css`

Find `.ad-placeholder` and modify:
```css
.ad-placeholder {
  width: 100%;
  height: 250px;  /* Change from 560px to 250px for 300x250 ads */
  /* ... rest stays same */
}
```

### Add More Ad Units

**Example**: Add third ad on homepage

**File**: `frontend/src/pages/Home.js`

After right sidebar, before closing `</div>`:
```jsx
<aside className="ad-sidebar ad-sidebar-extra">
  <div className="ad-sticky">
    <div className="ad-container">
      <div className="ad-label">Advertisement</div>
      <div className="ad-placeholder">
        {/* Your ad code */}
      </div>
    </div>
  </div>
</aside>
```

**File**: `frontend/src/styles/Home.css`

Add:
```css
.ad-sidebar-extra {
  order: 4;
}
```

---

## 🚀 Deployment After Adding Ads

### Step 1: Test Locally

```bash
cd frontend
npm start
```

1. Visit `http://localhost:3000`
2. Check:
   - Ads appear in correct positions
   - No console errors
   - Ads load correctly
   - Layout is not broken

### Step 2: Deploy to Production

```bash
git add frontend/
git commit -m "feat: add production ad codes"
git push origin main
```

Netlify will auto-deploy (~2-4 minutes)

### Step 3: Verify Production

1. Visit your Netlify URL
2. Clear browser cache (Ctrl+Shift+R)
3. Check:
   - Ads display correctly
   - Ad network tracking works
   - Responsive behavior works

---

## 📊 Ad Network Recommendations

### Best for Video Platforms

1. **Google AdSense** ⭐⭐⭐⭐⭐
   - Easy setup
   - Good revenue
   - Automatic optimization
   - Recommended for beginners

2. **Media.net** ⭐⭐⭐⭐
   - Yahoo/Bing ads
   - Good for US/UK traffic
   - Contextual ads

3. **PropellerAds** ⭐⭐⭐
   - Good for global traffic
   - Video ads available
   - Push notifications

4. **AdThrive / Mediavine** ⭐⭐⭐⭐⭐
   - Requires traffic threshold (50K+ monthly)
   - Highest RPM
   - Best revenue

### Ad Sizes to Use

**Recommended**:
- **300x600** (Half Page / Large Skyscraper) - Best for sidebars
- **300x250** (Medium Rectangle) - Versatile
- **728x90** (Leaderboard) - Good for top/bottom

**Avoid**:
- **Pop-ups** - Bad UX
- **Auto-playing video ads** - Annoying
- **Interstitials** - May violate policies

---

## 🔒 Ad Policy Compliance

### Google AdSense Policies

✅ **Allowed**:
- Educational content
- Entertainment
- User-generated content (with moderation)

❌ **Not Allowed**:
- Copyrighted content
- Adult content
- Violence/hate speech
- Misleading content

### Best Practices

1. **Content Moderation**:
   - Review uploaded videos
   - Remove policy-violating content
   - Implement reporting system

2. **Ad Placement**:
   - Don't place too many ads
   - Don't trick users into clicking
   - Maintain content-to-ads ratio

3. **User Experience**:
   - Ads should not block content
   - Page should load fast
   - Mobile-friendly

---

## 💰 Revenue Optimization Tips

### 1. Strategic Placement

**High-performing positions**:
- Above the fold (visible without scrolling)
- Near video player
- In content flow

**Low-performing positions**:
- Footer
- Far right sidebar on wide screens
- Below comments

### 2. A/B Testing

Test different:
- Ad sizes
- Ad positions
- Ad networks
- Number of ad units

### 3. Monitor Performance

Track:
- CPM (Cost Per Mille)
- CTR (Click-Through Rate)
- Viewability
- Revenue per session

---

## 🐛 Troubleshooting

### Issue 1: Ads Don't Show

**Possible causes**:
1. Ad blocker enabled → Tell users to disable
2. Ad code not loaded → Check network tab
3. Wrong ad unit ID → Verify in ad network dashboard
4. Site not approved → Wait for ad network approval

**Solution**:
1. Check browser console for errors
2. Verify ad code is correct
3. Test without ad blocker
4. Check ad network status

### Issue 2: Ads Break Layout

**Solution**:
1. Check ad size matches container
2. Add `overflow: hidden` to `.ad-container`
3. Set fixed height on `.ad-placeholder`

### Issue 3: Ads Slow Down Site

**Solution**:
1. Use lazy loading:
```javascript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load ad
      }
    });
  });
  // Observe ad container
}, []);
```

2. Async load ad scripts
3. Limit number of ad units

### Issue 4: Low Revenue

**Possible causes**:
1. Low traffic
2. Wrong audience
3. Bad ad placement
4. Ad blocker usage

**Solutions**:
1. Increase quality traffic
2. Optimize ad placement
3. Try different ad networks
4. Implement anti-ad-blocker

---

## 📈 Performance Monitoring

### Google Analytics Integration

**File**: `frontend/public/index.html`

Add before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Track ad views:
```javascript
// When ad loads
gtag('event', 'ad_impression', {
  'event_category': 'Ads',
  'event_label': 'Homepage Sidebar'
});
```

---

## ✅ Ads Integration Checklist

- [ ] Ad network account created
- [ ] Ad units created (correct sizes)
- [ ] Ad code added to components
- [ ] Ad script added to index.html
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Verified ads show correctly
- [ ] Tested responsive behavior
- [ ] Set up revenue tracking
- [ ] Compliant with ad policies

---

## 🎯 Summary

Your platform now has:
- ✅ **Homepage**: Left + Right sidebar ads (300x600)
- ✅ **Watch Page**: Right sidebar ads (300x600 + 300x250)
- ✅ **Responsive**: Hides on mobile, adapts on tablet
- ✅ **Easy to update**: Just replace placeholder div
- ✅ **Production-ready**: Works on Netlify deployment

**Replace ad placeholders with your actual ad codes and start monetizing!** 💰
