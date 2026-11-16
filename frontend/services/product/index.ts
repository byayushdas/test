import { fetchApi } from "../api";

export interface ProductData {
  cropName: string;
  quantity: number;
  unit?: string;
  pricePerUnit: number;
  harvestDate: string;
  location?: string;
  currentOwnerId: string;
  currentOwnerRole: string;
  description?: string;
}

export const productService = {
  async getAllProducts() {
    return fetchApi("/products");
  },

  async getProductsByOwner(ownerId: string) {
    const products = await fetchApi("/products");
    return products.filter((p: any) => p.currentOwnerId === ownerId);
  },

  async addHarvest(data: ProductData) {
    return fetchApi("/products", {
      method: "POST",
      body: JSON.stringify({
        unit: "kg",
        location: "Farm Location",
        description: "Fresh harvest logged from dashboard",
        ...data,
      }),
    });
  },

  async updateProduct(id: string, updates: Partial<ProductData> & { isListed?: boolean }) {
    return fetchApi(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async toggleListing(id: string, currentStatus: boolean) {
    return fetchApi(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isListed: !currentStatus }),
    });
  },

  async deleteProduct(id: string) {
    return fetchApi(`/products/${id}`, {
      method: "DELETE",
    });
  },
};
