import { base44 } from '@base44/node-sdk';

export default async function secureUploadFile(params, context) {
  const { file } = params;

  // Authentication check
  if (!context.user?.email) {
    throw new Error('Authentication required');
  }

  // Upload file using Core integration
  return await base44.asServiceRole.integrations.Core.UploadFile({
    file
  });
}