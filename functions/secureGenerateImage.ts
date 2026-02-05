import { base44 } from '@base44/node-sdk';

export default async function secureGenerateImage(params, context) {
  const { prompt, existing_image_urls } = params;

  // Authentication check
  if (!context.user?.email) {
    throw new Error('Authentication required');
  }

  // Generate image using Core integration
  return await base44.asServiceRole.integrations.Core.GenerateImage({
    prompt,
    existing_image_urls
  });
}