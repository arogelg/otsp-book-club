import { sql } from './db.js';
export default async () => {
  const rows = await sql`
    select b.id, b.title, b.author, b.genre, b.cover_url, b.summary,
           round(avg(r.rating))::int as avg_rating
    from books b
    left join reads r on r.book_id=b.id
    group by b.id
    order by coalesce(avg(r.rating),0) desc nulls last, b.title;
  `;
  return new Response(JSON.stringify(rows), {
    headers: {
      'content-type':'application/json',
      'access-control-allow-origin':'*'
    }
  });
};
