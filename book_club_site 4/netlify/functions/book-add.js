import { sql } from './db.js';
export default async (req, ctx) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Require auth
  const user = ctx?.clientContext?.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  const b = await req.json();
  if (!b?.title) return new Response('Title required', { status: 400 });

  const [row] = await sql`
    insert into books (title, author, genre, summary, cover_url)
    values (${b.title}, ${b.author||null}, ${b.genre||null}, ${b.summary||null}, ${b.coverUrl||b.cover_url||null})
    returning *;
  `;
  return new Response(JSON.stringify(row), {
    headers: { 'content-type':'application/json', 'access-control-allow-origin':'*' }
  });
};
