import { sql } from './db.js';
export default async () => { const rows = await sql`select 1 as ok;`; return new Response(JSON.stringify(rows),{headers:{'content-type':'application/json','access-control-allow-origin':'*'}})};
