import { sql } from './db.js';
export default async (req, ctx) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const user = ctx?.clientContext?.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { book_id, progress_pct = 0, rating = null } = await req.json();
  // Netlify Identity sub is a UUID v4, store it directly
  const user_id = user?.sub;

  if (!book_id) return new Response('book_id required', { status: 400 });

  const [row] = await sql`
    insert into reads (user_id, book_id, progress_pct, rating)
    values (${user_id}::uuid, ${book_id}::uuid, ${progress_pct}, ${rating})
    on conflict (user_id, book_id)
    do update set progress_pct = excluded.progress_pct, rating = excluded.rating
    returning *;
  `;
  return new Response(JSON.stringify(row), {
    headers: { 'content-type':'application/json', 'access-control-allow-origin':'*' }
  });
};
