import { searchUsda } from '@/api/usda';
import { UsdaFoodItem, UsdaSearchResponse } from '@/types';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import client from '@/api/client';

const mockChickenItem: UsdaFoodItem = {
  fdcId: '171477',
  description: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
  calories: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 4,
};

const mockResponse: UsdaSearchResponse = {
  foods: [mockChickenItem],
};

describe('searchUsda', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /usda/search with query and pageSize params', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

    await searchUsda('chicken', 3);

    expect(client.get).toHaveBeenCalledWith('/usda/search', {
      params: { query: 'chicken', pageSize: 3 },
    });
  });

  it('uses default pageSize of 5 when not provided', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

    await searchUsda('apple');

    expect(client.get).toHaveBeenCalledWith('/usda/search', {
      params: { query: 'apple', pageSize: 5 },
    });
  });

  it('returns the foods array from the response', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

    const result = await searchUsda('chicken', 3);

    expect(result).toEqual(mockResponse);
    expect(result.foods).toHaveLength(1);
    expect(result.foods[0].fdcId).toBe('171477');
    expect(result.foods[0].description).toBe(
      'Chicken, broilers or fryers, breast, meat only, cooked, roasted'
    );
    expect(result.foods[0].calories).toBe(165);
    expect(result.foods[0].proteinG).toBe(31);
  });

  it('returns an empty foods array when the response has no results', async () => {
    const emptyResponse: UsdaSearchResponse = { foods: [] };
    (client.get as jest.Mock).mockResolvedValueOnce({ data: emptyResponse });

    const result = await searchUsda('xyznonexistentfood', 5);

    expect(result.foods).toHaveLength(0);
  });

  it('propagates network errors to the caller', async () => {
    (client.get as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    await expect(searchUsda('chicken', 5)).rejects.toThrow('Network Error');
  });

  it('calls the endpoint once per invocation', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

    await searchUsda('banana', 2);

    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
