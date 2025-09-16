import { sweepSelfDestructingAttachments } from '../../server/tasks/retention';

export const config = {
  runtime: 'nodejs'
};

export const dynamic = 'force-dynamic';

/**
 * Handles POST requests to sweep self-destructing attachments.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' }
    });
  }

  const removed = await sweepSelfDestructingAttachments();

  return new Response(JSON.stringify({ removed }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
