import { enforceRetention } from '../../server/tasks/retention';

export const config = {
  runtime: 'nodejs18.x'
};

export const dynamic = 'force-dynamic';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' }
    });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const retentionDays = daysParam ? Number(daysParam) : undefined;
  const days = Number.isFinite(retentionDays) ? Number(retentionDays) : 30;

  const removed = await enforceRetention(days);

  return new Response(
    JSON.stringify({ removed, days }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }
  );
}
