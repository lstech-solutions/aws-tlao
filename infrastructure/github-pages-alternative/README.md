# GitHub Pages Alternative for tláo.com

## Overview

This approach uses GitHub Pages native features instead of AWS for redirecting `tláo.com` to your GitHub Pages site.

## Option 1: GitHub Pages Custom Domain (Simplest)

GitHub Pages supports custom domains with SSL. However, `tláo.com` with diacritics might not be fully supported.

### Steps:

1. **Configure CNAME in GitHub Pages**:
   - Go to repository Settings → Pages
   - Under "Custom domain", enter `tláo.com`
   - Save

2. **Add DNS Records** at your domain registrar:

   ```
   Type    Name          Value
   ----    ----          -----
   A       tláo.com      185.199.108.153
   A       tláo.com      185.199.109.153
   A       tláo.com      185.199.110.153
   A       tláo.com      185.199.111.153
   CNAME   www.tláo.com  lstech-solutions.github.io
   ```

3. **Wait for SSL certificate** (GitHub automatically provisions Let's Encrypt)

### Limitations:

- International domain names (IDN) like `tláo.com` might not work properly
- No control over SSL certificate issuance
- Limited to GitHub Pages features

## Option 2: Cloudflare Proxy (Free Alternative)

Use Cloudflare as a proxy to handle the redirect and SSL.

### Steps:

1. **Sign up for Cloudflare** (free plan)

2. **Add your domain** to Cloudflare

3. **Update nameservers** at your domain registrar to Cloudflare's

4. **Configure in Cloudflare**:
   - DNS: Create CNAME record pointing to `lstech-solutions.github.io`
   - SSL/TLS: Set to "Full" (strict)
   - Page Rules: Create rule for `tláo.com/*` → Redirect to `https://lstech-solutions.github.io/aws-tlao/$1`

5. **Configure GitHub Pages**:
   - In repository Settings → Pages
   - Add `tláo.com` as custom domain
   - Enable "Enforce HTTPS"

### Benefits:

- Free SSL certificate
- CDN benefits
- Better control over redirects
- Works with international domains

## Option 3: Simple HTML Redirect (Minimal)

Create a simple HTML file that redirects, hosted anywhere.

### `index.html` for redirect:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=https://lstech-solutions.github.io/aws-tlao/" />
    <title>Redirecting to TLÁO Documentation</title>
  </head>
  <body>
    <p>
      Redirecting to
      <a href="https://lstech-solutions.github.io/aws-tlao/">TLÁO Documentation</a>...
    </p>
  </body>
</html>
```

Host this on any static hosting service (Netlify, Vercel, etc.) with `tláo.com` domain.

## Recommendation

For your use case:

1. **If `tláo.com` works with GitHub Pages**: Use Option 1 (simplest)
2. **If GitHub Pages has issues with IDN**: Use Option 2 (Cloudflare)
3. **If you need more control**: Use Option 3 (custom hosting) or the AWS solution

## Testing International Domain Support

Test if `tláo.com` works with GitHub Pages:

```bash
# Check if GitHub Pages serves the domain
curl -I https://lstech-solutions.github.io/aws-tlao/

# Test domain resolution
dig tláo.com
nslookup tláo.com

# Test with Punycode (IDN encoded)
# tláo.com in Punycode is: xn--tlo-2na.com
curl -I https://xn--tlo-2na.com/
```

## Next Steps

1. Try configuring `tláo.com` directly in GitHub Pages Settings
2. If it doesn't work, try the Punycode version `xn--tlo-2na.com`
3. Consider Cloudflare if GitHub Pages has limitations
4. Use AWS solution only if other options fail

## Cost Comparison

- **GitHub Pages**: Free
- **Cloudflare**: Free
- **AWS**: ~$1/month
- **Netlify/Vercel**: Free for basic use

Choose the simplest option that works for your domain.
