export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/'))return api(request,env);
    if(!['GET','HEAD'].includes(request.method))return new Response('',{status:405});
    const pathname=url.pathname==='/'?'/index.html':url.pathname;
    const entry=assets[pathname];
    if(!entry)return new Response('찾을 수 없는 페이지입니다.',{status:404});
    const [type,data]=entry;
    const headers={'Content-Type':type,'Content-Encoding':'gzip','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':pathname.startsWith('/vendor/')||pathname.startsWith('/assets/')?'public, max-age=86400':'no-cache'};
    if(request.method==='HEAD')return new Response(null,{headers});
    const bytes=Uint8Array.from(atob(data),char=>char.charCodeAt(0));
    return new Response(bytes,{headers,encodeBody:'manual'});
  }
};

