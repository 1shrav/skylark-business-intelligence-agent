export const config = {
  monday: {
    apiToken: process.env.MONDAY_API_TOKEN || '',
    dealsBoardId: process.env.MONDAY_DEALS_BOARD_ID || '5030844311',
    workOrdersBoardId: process.env.MONDAY_WORK_ORDERS_BOARD_ID || '5030845140',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  },
  env: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.monday.apiToken) {
    errors.push('MONDAY_API_TOKEN is required');
  }
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error('Configuration validation failed: ' + errors.join(', '));
  }
}