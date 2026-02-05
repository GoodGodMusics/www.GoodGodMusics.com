import { base44 } from '@base44/node-sdk';

export default async function secureSendEmail(params, context) {
  const { to, subject, body, from_name } = params;

  // Authentication check
  if (!context.user?.email) {
    throw new Error('Authentication required');
  }

  // Optional: Add rate limiting for non-admin users
  const isAdmin = context.user?.role === 'admin';
  
  // Send email using Core integration
  return await base44.asServiceRole.integrations.Core.SendEmail({
    to,
    subject,
    body,
    from_name: from_name || 'Bible Harmony'
  });
}