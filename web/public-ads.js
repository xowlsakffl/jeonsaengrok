// Only the public library and editorial stories load the publisher's ad script.
if (location.origin === 'https://jeonsaengrok.com') {
  try {
    if (!sessionStorage.getItem('jeonsaeng.reading-session.v1')) {
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
