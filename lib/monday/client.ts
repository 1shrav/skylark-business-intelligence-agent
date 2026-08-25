import { GraphQLClient } from 'graphql-request';
import { config } from '../config';

const client = new GraphQLClient('https://api.monday.com/v2', {
  headers: {
    Authorization: config.monday.apiToken,
    'Content-Type': 'application/json',
  },
});

export interface RawDeal {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    text: string;
    value: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface RawWorkOrder {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    text: string;
    value: string;
  }>;
  created_at: string;
  updated_at: string;
}

const DEALS_QUERY = `
  query GetDeals($boardId: ID!) {
    boards(ids: [$boardId]) {
      items_page(limit: 500) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
          created_at
          updated_at
        }
      }
    }
  }
`;

const WORK_ORDERS_QUERY = `
  query GetWorkOrders($boardId: ID!) {
    boards(ids: [$boardId]) {
      items_page(limit: 500) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
          created_at
          updated_at
        }
      }
    }
  }
`;

export async function fetchDeals(): Promise<RawDeal[]> {
  try {
    console.log('[Monday Client] Fetching deals...');
    console.log('[Monday Client] Board ID:', config.monday.dealsBoardId);
    console.log('[Monday Client] Board ID type:', typeof config.monday.dealsBoardId);
    console.log('[Monday Client] API Token present:', !!config.monday.apiToken);
    console.log('[Monday Client] API Token length:', config.monday.apiToken?.length || 0);
    console.log('[Monday Client] API Token first 20 chars:', config.monday.apiToken?.substring(0, 20));
    
    if (!config.monday.dealsBoardId) {
      console.error('[Monday Client] Board ID is missing!');
      return [];
    }
    
    if (!config.monday.apiToken) {
      console.error('[Monday Client] API Token is missing!');
      return [];
    }
    
    const data: any = await client.request(DEALS_QUERY, {
      boardId: String(config.monday.dealsBoardId),
    });
    
    console.log('[Monday Client] Response received');
    console.log('[Monday Client] Boards array length:', data.boards?.length || 0);
    
    if (!data.boards || data.boards.length === 0) {
      console.error('[Monday Client] No boards returned - possible auth issue or wrong board ID');
      console.error('[Monday Client] Response:', JSON.stringify(data).substring(0, 500));
      return [];
    }
    
    const items = data.boards[0]?.items_page?.items || [];
    console.log('[Monday Client] Deals fetched:', items.length);
    
    if (items.length === 0) {
      console.warn('[Monday Client] Board exists but contains 0 items');
    }
    
    return items;
  } catch (error: any) {
    console.error('[Monday Client] Failed to fetch deals:', error.message);
    console.error('[Monday Client] Error type:', error.constructor.name);
    if (error.response) {
      console.error('[Monday Client] Response status:', error.response.status);
      console.error('[Monday Client] Response errors:', JSON.stringify(error.response.errors));
    }
    // Don't throw - return empty array to prevent cascading failures
    return [];
  }
}

export async function fetchWorkOrders(): Promise<RawWorkOrder[]> {
  try {
    console.log('[Monday Client] Fetching work orders...');
    console.log('[Monday Client] Board ID:', config.monday.workOrdersBoardId);
    
    if (!config.monday.workOrdersBoardId) {
      console.error('[Monday Client] Work Orders Board ID is missing!');
      return [];
    }
    
    const data: any = await client.request(WORK_ORDERS_QUERY, {
      boardId: String(config.monday.workOrdersBoardId),
    });
    
    const items = data.boards[0]?.items_page?.items || [];
    console.log('[Monday Client] Work orders fetched:', items.length);
    
    return items;
  } catch (error: any) {
    console.error('[Monday Client] Failed to fetch work orders:', error.message);
    // Don't throw - return empty array
    return [];
  }
}