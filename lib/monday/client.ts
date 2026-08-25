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
      items_page {
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
      items_page {
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
    const data: any = await client.request(DEALS_QUERY, {
      boardId: config.monday.dealsBoardId,
    });
    return data.boards[0]?.items_page?.items || [];
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    throw new Error('Monday.com API error: Unable to fetch deals');
  }
}

export async function fetchWorkOrders(): Promise<RawWorkOrder[]> {
  try {
    const data: any = await client.request(WORK_ORDERS_QUERY, {
      boardId: config.monday.workOrdersBoardId,
    });
    return data.boards[0]?.items_page?.items || [];
  } catch (error) {
    console.error('Failed to fetch work orders:', error);
    throw new Error('Monday.com API error: Unable to fetch work orders');
  }
}
