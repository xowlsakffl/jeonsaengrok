import { api } from './api.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      // This deployment has no Sites login. Only the Cloudflare edge supplies the visitor address.
      const apiRequest = new Request(request);
      apiRequest.headers.delete('oai-authenticated-user-id');
      return api(apiRequest, env);
    }
    if (url.pathname === '/index.html' && ['GET','HEAD'].includes(request.method)) {
      url.pathname = '/';
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname === '/') url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
};
