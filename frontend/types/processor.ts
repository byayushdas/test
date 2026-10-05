export interface ProcessorCompany {
  companyName: string;
  factoryLocation: string;
  coordinates: string;
  processorId: string;
  verificationStatus: "Verified" | "Pending" | "Unverified";
  factoryCapacity: string;
  mainCategories: string[];
}

export interface FarmerHarvestItem {
  id: string;
  batchId: string;
  cropName: string;
  farmerName: string;
  farmerLocation: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  harvestDate: string;
  hasQrCode: boolean;
  imageUrl?: string;
  variety?: string;
  originalCropImage?: string;
  traceUrl?: string;
  parentRawBatchIds?: string[];
  originDetails?: any;
}

export interface CartItem {
  harvestItem: FarmerHarvestItem;
  selectedQuantity: number;
}

export interface RawMaterialStock {
  id: string;
  batchId: string;
  productName: string;
  supplierFarmer: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  status: "In Stock" | "In Processing" | "Depleted";
}

export interface ProcessedProductItem {
  id: string;
  processedBatchId: string;
  parentRawBatchId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  processingDate: string;
  description: string;
  imageUrl?: string;
  qrCodeUrl?: string;
}

export interface ProcessorOrder {
  id: string;
  orderNumber: string;
  partyName: string;
  partyRole: "FARMER" | "DISTRIBUTOR";
  itemsSummary: string;
  totalAmount: string;
  date: string;
  status: "PENDING" | "PROCESSING" | "DISPATCHED" | "DELIVERED";
}

export interface ProcessorShipment {
  id: string;
  shipmentNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  status: "In Transit" | "Dispatched" | "Delivered";
  estimatedDelivery: string;
}
