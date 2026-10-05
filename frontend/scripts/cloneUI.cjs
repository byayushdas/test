const fs = require('fs');

const farmerOrdersPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/farmer/farmerHub/orders/index.tsx';
const distributorOrdersPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/distributor/distributorHub/orders/index.tsx';
const retailerOrdersPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/retailer/retailerHub/orders/index.tsx';

let ordersContent = fs.readFileSync(farmerOrdersPath, 'utf8');

// For Distributor
let distOrders = ordersContent
  .replace(/FarmerOrders/g, 'DistributorOrders')
  .replace(/Seed2Shelf Farmer/g, 'Seed2Shelf Distributor')
  .replace(/farmerId/g, 'distributorId')
  .replace(/api\/v1\/farmer\//g, 'api/v1/distributor/')
  .replace(/Buyer: Processor Corp/g, 'Buyer: Retailer Corp')
  .replace(/Farmer Hub/g, 'Distributor Hub')
  .replace(/farmer/g, 'distributor')
  .replace(/Farmer/g, 'Distributor');
fs.writeFileSync(distributorOrdersPath, distOrders);

// For Retailer
let retOrders = ordersContent
  .replace(/FarmerOrders/g, 'RetailerOrders')
  .replace(/Seed2Shelf Farmer/g, 'Seed2Shelf Retailer')
  .replace(/farmerId/g, 'retailerId')
  .replace(/api\/v1\/farmer\//g, 'api/v1/retailer/')
  .replace(/Buyer: Processor Corp/g, 'Buyer: Store/Customer')
  .replace(/Farmer Hub/g, 'Retail Hub')
  .replace(/farmer/g, 'retailer')
  .replace(/Farmer/g, 'Retailer');
fs.writeFileSync(retailerOrdersPath, retOrders);

const farmerShipmentsPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/farmer/farmerHub/shipments/index.tsx';
const distributorShipmentsPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/distributor/distributorHub/shipments/index.tsx';
const retailerShipmentsPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/retailer/retailerHub/shipments/index.tsx';

let shipmentsContent = fs.readFileSync(farmerShipmentsPath, 'utf8');

// For Distributor
let distShipments = shipmentsContent
  .replace(/FarmerShipments/g, 'DistributorShipments')
  .replace(/Seed2Shelf Farmer/g, 'Seed2Shelf Distributor')
  .replace(/farmerId/g, 'distributorId')
  .replace(/api\/v1\/farmer\//g, 'api/v1/distributor/')
  .replace(/Farmer Hub/g, 'Distributor Hub')
  .replace(/Processor Delivery/g, 'Retailer Delivery')
  .replace(/Processor Accept/g, 'Retailer Accept')
  .replace(/farmer/g, 'distributor')
  .replace(/Farmer/g, 'Distributor')
  .replace(/cropName/g, 'itemName');
fs.writeFileSync(distributorShipmentsPath, distShipments);

// For Retailer
let retShipments = shipmentsContent
  .replace(/FarmerShipments/g, 'RetailerShipments')
  .replace(/Seed2Shelf Farmer/g, 'Seed2Shelf Retailer')
  .replace(/farmerId/g, 'retailerId')
  .replace(/api\/v1\/farmer\//g, 'api/v1/retailer/')
  .replace(/Farmer Hub/g, 'Retail Hub')
  .replace(/Processor Delivery/g, 'Store/Customer Delivery')
  .replace(/Processor Accept/g, 'Customer Accept')
  .replace(/farmer/g, 'retailer')
  .replace(/Farmer/g, 'Retailer')
  .replace(/cropName/g, 'itemName');
fs.writeFileSync(retailerShipmentsPath, retShipments);

console.log("Done cloning orders and shipments from farmer to distributor and retailer");
