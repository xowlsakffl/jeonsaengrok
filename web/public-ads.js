async function loadAdFit(slot) {
  if (!slot || !matchMedia('(min-width: 320px)').matches) return;
  try {
    const response = await fetch('/api/public-ads');
    if (!response.ok) return;
    const units = await response.json();
    const unit = units[slot.dataset.placement];
    if (!unit || sessionStorage.getItem('jeonsaeng.reading-session.v1')) return;
    const banner = document.createElement('ins');
    banner.className = 'kakao_ad_area';
    banner.style.cssText = 'display:none;width:100%';
    banner.dataset.adUnit = unit;
    banner.dataset.adWidth = '320';
    banner.dataset.adHeight = '100';
    slot.querySelector('.public-ad-banner').append(banner);
    slot.hidden = false;
    const sdk = document.createElement('script');
    sdk.async = true;
    sdk.src = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
    sdk.addEventListener('error', () => { slot.hidden = true; });
    document.body.append(sdk);
  } catch { /* Public stories remain readable when the ad provider is unavailable. */ }
}

// Only public editorial pages request ads, outside a personal reading session.
if (location.origin === 'https://jeonsaengrok.com') {
  try {
    if (!sessionStorage.getItem('jeonsaeng.reading-session.v1')) {
      void loadAdFit(document.querySelector('.public-ad-slot'));
      const consent = window.googlefc ||= {};
      consent.callbackQueue ||= [];
      consent.callbackQueue.push({
        CONSENT_API_READY() {
          if (typeof window.__tcfapi !== 'function') return;
          window.__tcfapi('addEventListener', 2, (data, ok) => {
            const footer = document.querySelector('footer .wrap');
            if (!ok || !data?.gdprApplies || !footer || footer.querySelector('[data-consent-settings]')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.consentSettings = '';
            button.textContent = '광고 동의 설정';
            button.addEventListener('click', () => consent.showRevocationMessage());
            footer.append(button);
          });
        }
      });
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9112551758734193';
      document.head.append(script);
    }
  } catch { /* Reading the public stories also works when storage is unavailable. */ }
}
