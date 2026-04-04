// resources/js/Components/Analytics.jsx
import { useEffect } from 'react';

export default function Analytics({ tagManagerId, pixelId }) {
  useEffect(() => {
    if (!tagManagerId && !pixelId) return;

    // Google Analytics
    if (tagManagerId) {
      const gtagScript = document.createElement('script');
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=G-${tagManagerId}`;
      gtagScript.async = true;
      document.head.appendChild(gtagScript);

      gtagScript.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', `G-${tagManagerId}`);
        
        window.gtag('event', 'page_view');
      };
    }

    // Facebook Pixel
    if (pixelId) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e); t.async = true;
        t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script');

      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }

    // Track page changes via MutationObserver on document title
    const trackPageView = () => {
      if (window.gtag) window.gtag('event', 'page_view');
      if (window.fbq) window.fbq('track', 'PageView');
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target === document.head) {
          trackPageView();
        }
      });
    });

    observer.observe(document.head, {
      childList: true,
      subtree: false,
    });

    return () => {
      observer.disconnect();
    };
  }, [tagManagerId, pixelId]);

  return null;
}
