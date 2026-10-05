const fs = require('fs');

const processorPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/processor/processorHub/processedInventory/index.tsx';
const distributorPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/distributor/distributorHub/supplyHub/index.tsx';
const retailerPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/retailer/retailerHub/retailHub/index.tsx';

let content = fs.readFileSync(processorPath, 'utf8');

// Replacements for Distributor
let distContent = content
  .replace(/Production Hub/g, 'Supply Hub')
  .replace(/ProductionHubPage/g, 'SupplyHubPage')
  .replace(/Processor/g, 'Distributor')
  .replace(/processor/g, 'distributor')
  .replace(/Log New Processed Item/g, 'Log New Distributed Item')
  .replace(/Processed Product/g, 'Distributed Product')
  .replace(/Processed Products/g, 'Distributed Products')
  .replace(/PROCESSED/g, 'DISTRIBUTED')
  .replace(/PROC-/g, 'DIST-')
  .replace(/Factory/g, 'Boxes') // using Boxes icon for distributor hub
  .replace(/Purchase Price/g, 'Purchase Price')
  .replace(/Processed Volume/g, 'Distributed Volume')
  .replace(/Processed Product Photo/g, 'Distributed Product Photo')
  .replace(/Processing Date/g, 'Distribution Date')
  .replace(/Processing Status/g, 'Distribution Status')
  .replace(/Sent for Processing/g, 'Sent for Distribution')
  .replace(/Available for Processing/g, 'Available for Distribution')
  .replace(/Fully Processed/g, 'Fully Distributed')
  .replace(/In Processing/g, 'In Distribution');

fs.writeFileSync(distributorPath, distContent);

// Replacements for Retailer
let retContent = content
  .replace(/Production Hub/g, 'Retail Hub')
  .replace(/ProductionHubPage/g, 'RetailHubPage')
  .replace(/Processor/g, 'Retailer')
  .replace(/processor/g, 'retailer')
  .replace(/Log New Processed Item/g, 'Log New Retailed Item')
  .replace(/Processed Product/g, 'Retailed Product')
  .replace(/Processed Products/g, 'Retailed Products')
  .replace(/PROCESSED/g, 'RETAILED')
  .replace(/PROC-/g, 'RET-')
  .replace(/Factory/g, 'Store') // using Store icon for retailer hub
  .replace(/Processed Volume/g, 'Retailed Volume')
  .replace(/Processed Product Photo/g, 'Retailed Product Photo')
  .replace(/Processing Date/g, 'Retail Date')
  .replace(/Processing Status/g, 'Retail Status')
  .replace(/Sent for Processing/g, 'Sent for Retail')
  .replace(/Available for Processing/g, 'Available for Retail')
  .replace(/Fully Processed/g, 'Fully Retailed')
  .replace(/In Processing/g, 'In Retail');

fs.writeFileSync(retailerPath, retContent);

console.log("Done generating Supply Hub and Retail Hub");
