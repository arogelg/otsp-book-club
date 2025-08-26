import { sql } from './db.js';
export default async (req, ctx) => {
  // Called after login to make sure user exists in 'users' table
  const user = ctx?.clientContext?.user;
  if (!user) return new Response('Unauthorized', { status: 401 });
  const name = user?.user_metadata?.full_name || null;
  const email = user?.email || null;
  const id = user?.sub;
  await sql`
    insert into users (id, email, name)
    values (${id}::uuid, ${email}, ${name})
    on conflict (id) do update set email = excluded.email, name = excluded.name;
  `;
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type':'application/json', 'access-control-allow-origin':'*' }
  });
};
