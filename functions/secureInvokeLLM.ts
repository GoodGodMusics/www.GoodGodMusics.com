import { base44 } from '@base44/node-sdk';

export default async function secureInvokeLLM(params, context) {
  const { prompt, response_json_schema, add_context_from_internet, file_urls, use_grok } = params;

  // Rate limiting check (optional - you can adjust limits)
  const userEmail = context.user?.email;
  if (!userEmail && !context.user) {
    throw new Error('Authentication required');
  }

  // If Grok is requested and API key is available
  if (use_grok) {
    const grokApiKey = context.secrets.VITE_GROK_API_KEY;
    if (grokApiKey) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokApiKey}`
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are Grok, a helpful AI assistant focused on creating uplifting Christian content. Always respond with valid JSON only when requested.' },
              { role: 'user', content: prompt }
            ],
            model: 'grok-beta',
            temperature: 0.8
          })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // If JSON schema requested, parse response
        if (response_json_schema) {
          return JSON.parse(content);
        }
        return content;
      } catch (error) {
        console.error('Grok API failed, falling back to Core.InvokeLLM:', error);
        // Fall through to Core.InvokeLLM
      }
    }
  }

  // Use Core.InvokeLLM as primary or fallback
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema,
    add_context_from_internet,
    file_urls
  });
}