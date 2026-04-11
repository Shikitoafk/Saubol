import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_PREFIXES = [
  "https://engnovate.com/ielts-reading-tests/cambridge-ielts-",
  "https://engnovate.com/ielts-listening-tests/cambridge-ielts-",
];

const HIDE_CSS = `
<base href="https://engnovate.com/">
<style>
  .announcement-bar,
  #masthead,
  .site-header,
  .site-footer,
  footer,
  #wpadminbar,
  .ast-above-header-bar,
  .entry-header,
  .ast-breadcrumbs-wrapper,
  .entry-meta,
  .post-navigation,
  .comments-area,
  .related-posts,
  .sidebar,
  #secondary,
  .widget-area,
  [class*="upsell"],
  [class*="promo-"],
  [class*="upgrade-"],
  [class*="premium-cta"],
  [class*="cta-box"],
  [class*="tip-bar"],
  [class*="-tip-bar"],
  [class*="shortcut-tip"],
  [class*="fullscreen-tip"],
  .ast-pagination-section,
  .wp-block-group.is-layout-constrained > .alignfull:first-child { display: none !important; }

  html { scroll-padding-top: 0 !important; }
  body { margin-top: 0 !important; padding-top: 0 !important; }
  #page, .hfeed { padding-top: 0 !important; margin-top: 0 !important; }
  #content, .ast-container, .site-content { padding-top: 0 !important; margin-top: 0 !important; }
  .ast-article-single, .single-post, .entry-content-wrap { margin-top: 0 !important; }
  #primary, .content-area { width: 100% !important; max-width: 100% !important; flex: none !important; }
</style>`;

const CLEAN_SCRIPT = `
<script>
(function() {
  function clean() {
    ['.announcement-bar','#masthead','header.site-header',
     '.site-footer','footer','#wpadminbar','.entry-header',
     '.ast-breadcrumbs-wrapper'].forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n) {
      if (n.nodeValue && /engnovate/i.test(n.nodeValue)) {
        var parent = n.parentElement;
        if (parent && !['SCRIPT','STYLE','A'].includes(parent.tagName)) {
          n.nodeValue = n.nodeValue.replace(/Engnovate/g, '').replace(/engnovate/gi, '');
        }
      }
    });

    document.querySelectorAll('a[href*="engnovate.com"]').forEach(function(a) {
      if (!a.href.match(/\\.(css|js|png|jpg|svg|woff|gif)/)) {
        a.removeAttribute('href');
        a.style.pointerEvents = 'none';
        a.style.cursor = 'default';
      }
    });

    document.querySelectorAll('img[alt*="ngnovate"], img[src*="engnovate-text-logo"]').forEach(function(img) {
      img.remove();
    });

    if (document.title && /engnovate/i.test(document.title)) {
      document.title = document.title.replace(/[\\s\\-–|]*Engnovate[^)"]*/gi, '').trim();
    }

    document.querySelectorAll('div, p, section, aside, article').forEach(function(el) {
      var text = (el.textContent || '').trim();
      if ((text.startsWith('Tip:') && text.includes('F11')) ||
          text.includes('Skyrocket your IELTS') ||
          text.includes('Check it out')) {
        if (el.tagName !== 'BODY' && el.tagName !== 'HTML') el.remove();
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clean);
  } else {
    clean();
  }
  setTimeout(clean, 800);
})();
</script>`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).send("Missing url");
  }

  const allowed = ALLOWED_PREFIXES.some((p) => url.startsWith(p));
  if (!allowed) {
    return res.status(403).send("Forbidden");
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Upstream error");
    }

    let html = await upstream.text();

    html = html.replace(/<head([^>]*)>/i, `<head$1>${HIDE_CSS}`);
    html = html.replace(/<\/body>/i, `${CLEAN_SCRIPT}</body>`);
    html = html.replace(
      /<div[^>]+class="[^"]*announcement-bar[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ""
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.status(200).send(html);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy failed");
  }
}
