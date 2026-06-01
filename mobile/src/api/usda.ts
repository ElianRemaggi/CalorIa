import client from './client';
import { UsdaSearchResponse } from '@/types';

export const searchUsda = async (query: string, pageSize = 5): Promise<UsdaSearchResponse> => {
  const { data } = await client.get<UsdaSearchResponse>('/usda/search', {
    params: { query, pageSize },
  });
  return data;
};
