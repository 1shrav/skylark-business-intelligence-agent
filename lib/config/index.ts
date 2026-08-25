export const config = {
  monday: {
    apiToken: process.env.MONDAY_API_TOKEN || '',
    dealsBoardId: process.env.MONDAY_DEALS_BOARD_ID || '5030844311',
    workOrdersBoardId: process.env.MONDAY_WORK_ORDERS_BOARD_ID || '5030845140',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseURL: 'https://api.groq.com/openai/v1',
  },
  env: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.monday.apiToken) {
    errors.push('MONDAY_API_TOKEN is required');
  }
  if (!config.groq.apiKey) {
    errors.push('GROQ_API_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error('Configuration validation failed: ' + errors.join(', '));
  }
}
