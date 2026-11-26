// Only the public library and editorial stories load the publisher's ad script.
if (location.origin === 'https://jeonsaeng-rok.deftpiece16.chatgpt.site') {
  try {
    if (!sessionStorage.getItem('jeonsaeng.reading-session.v1')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9112551758734193';
      document.head.append(script);
    }
  } catch { /* Reading the public stories also works when storage is unavailable. */ }
}
