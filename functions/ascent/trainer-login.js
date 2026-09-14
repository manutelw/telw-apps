export async function onRequest() {
  return new Response(null, {
    status: 302,
    headers: {
      location: '/ascent/',
      'cache-control': 'no-store, max-age=0'
    }
  });
}
