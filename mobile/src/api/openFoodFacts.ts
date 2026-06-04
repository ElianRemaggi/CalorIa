export interface OpenFoodFactsResult {
  found: boolean;
  title: string;
  brand?: string;
  calories100g: number | null;
  protein100g: number | null;
  carbs100g: number | null;
  fat100g: number | null;
  servingSize?: string;
}

export const lookupBarcode = async (barcode: string): Promise<OpenFoodFactsResult> => {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CalorIA/1.0 (contact@caloria.app)' },
  });

  if (!res.ok) throw new Error(`OpenFoodFacts error ${res.status}`);

  const json = await res.json();
  if (json.status !== 1 || !json.product) {
    return { found: false, title: '', calories100g: null, protein100g: null, carbs100g: null, fat100g: null };
  }

  const { product_name, brands, nutriments, serving_size } = json.product;
  const n = nutriments ?? {};

  return {
    found: true,
    title: product_name || 'Producto desconocido',
    brand: brands || undefined,
    calories100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
    protein100g: n.proteins_100g ?? n.proteins ?? null,
    carbs100g: n.carbohydrates_100g ?? n.carbohydrates ?? null,
    fat100g: n.fat_100g ?? n.fat ?? null,
    servingSize: serving_size || undefined,
  };
};
