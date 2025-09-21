import { enforceRetention } from '../../server/tasks/retention';

export const config = {
  runtime: 'nodejs'
};

export const dynamic = 'force-dynamic';

/**
 * Handles incoming HTTP requests for retention enforcement.
 *
 * This function checks if the request method is POST; if not, it returns a 405 Method Not Allowed response.
 * It retrieves the 'days' parameter from the request URL, defaults to 30 if not provided or invalid,
 * and then calls the enforceRetention function with the determined days value. Finally, it returns a
 * JSON response containing the number of removed items and the days used for retention.
 *
 * @param request - The incoming HTTP request object.
 */
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
