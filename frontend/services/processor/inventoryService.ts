import { RawMaterialStock, ProcessedProductItem } from "@/types/processor";

let rawMaterials: RawMaterialStock[] = [
  {
    id: "RAW-101",
    batchId: "BATCH-2026-081",
    productName: "Organic Alphonso Mangoes",
    supplierFarmer: "Ramesh Kumar",
    quantity: 1200,
    unit: "kg",
    purchaseDate: "July 16, 2026",
    status: "In Stock"
  },
  {
    id: "RAW-102",
    batchId: "BATCH-2026-079",
    productName: "Organic Pusa Basmati Paddy",
    supplierFarmer: "Sukhwinder Singh",
    quantity: 4500,
    unit: "kg",
    purchaseDate: "July 14, 2026",
    status: "In Processing"
  },
  {
    id: "RAW-103",
    batchId: "BATCH-2026-068",
    productName: "Premium Sharbati Wheat",
    supplierFarmer: "Rajesh Sharma",
    quantity: 3500,
    unit: "kg",
    purchaseDate: "July 10, 2026",
    status: "In Stock"
  },
  {
    id: "RAW-104",
    batchId: "BATCH-2026-064",
    productName: "Fresh Red Tomatoes",
    supplierFarmer: "Balwinder Patil",
    quantity: 2000,
    unit: "kg",
    purchaseDate: "July 06, 2026",
    status: "In Stock"
  }
];

let processedProducts: ProcessedProductItem[] = [
  {
    id: "PROC-801",
    processedBatchId: "PRC-BATCH-2026-901",
    parentRawBatchId: "BATCH-2026-079",
    productName: "Premium Aged Basmati Rice",
    category: "Grains & Rice",
    quantity: 3200,
    unit: "kg",
    processingDate: "July 18, 2026",
    description: "Milled, polished, and packaged premium organic basmati rice",
    imageUrl: "",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PRC-BATCH-2026-901"
  },
  {
    id: "PROC-802",
    processedBatchId: "PRC-BATCH-2026-902",
    parentRawBatchId: "BATCH-2026-081",
    productName: "Pure Alphonso Mango Pulp",
    category: "Beverages & Concentrates",
    quantity: 850,
    unit: "Liters",
    processingDate: "July 17, 2026",
    description: "Aseptic double-filtered Alphonso mango pulp without preservatives",
    imageUrl: "",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PRC-BATCH-2026-902"
  },
  {
    id: "PROC-803",
    processedBatchId: "PRC-BATCH-2026-903",
    parentRawBatchId: "BATCH-2026-068",
    productName: "Whole Wheat Chakki Atta",
    category: "Flour & Grains",
    quantity: 2800,
    unit: "kg",
    processingDate: "July 15, 2026",
    description: "Traditional stone-ground whole wheat flour",
    imageUrl: "",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PRC-BATCH-2026-903"
  }
];

export const inventoryService = {
  getRawMaterials(): RawMaterialStock[] {
    return rawMaterials;
  },

  getProcessedProducts(): ProcessedProductItem[] {
    return processedProducts;
  },

  logProcessedItem(item: Omit<ProcessedProductItem, "id" | "processedBatchId" | "qrCodeUrl">): ProcessedProductItem {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newBatchId = `PRC-BATCH-2026-${randomNum}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newBatchId}`;
    
    const newItem: ProcessedProductItem = {
      ...item,
      id: `PROC-${randomNum}`,
      processedBatchId: newBatchId,
      qrCodeUrl: qrUrl
    };

    processedProducts.unshift(newItem);
    return newItem;
  }
};
