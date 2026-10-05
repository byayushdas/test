const fs = require('fs');

const processorPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/processor/processorHub/shipments/index.tsx';
const distributorPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/distributor/distributorHub/shipments/index.tsx';
const retailerPath = 'c:/Users/user/Desktop/SEED2SELF/frontend/pages/retailer/retailerHub/shipments/index.tsx';

let content = fs.readFileSync(processorPath, 'utf8');

// Distributor Replacements
let distContent = content
  .replace(/ProcessorShipmentsPage/g, 'DistributorShipmentsPage')
  .replace(/Seed2Shelf Processor/g, 'Seed2Shelf Distributor')
  .replace(/Processor B2B incoming farmer deliveries and outgoing distributor shipments\./g, 'Distributor B2B incoming processor deliveries and outgoing retailer shipments.')
  .replace(/\(Farmer -> Processor\)/g, '(Processor -> Distributor)')
  .replace(/\(Processor -> Distributor\)/g, '(Distributor -> Retailer)')
  .replace(/"Farmer Hub" \? "Farmer Hub" : "Processor Hub"/g, 'activeSignal === "INCOMING" ? "Processor Hub" : "Distributor Hub"') // Will handle this manually if it's complex
  .replace(/activeSignal === "INCOMING" \? "Farmer Hub" : "Processor Hub"/g, 'activeSignal === "INCOMING" ? "Processor Hub" : "Distributor Hub"')
  .replace(/Processor Rejection Details & Reason/g, 'Processor Rejection Details & Reason') // Incoming for dist is from processor
  .replace(/Distributor Rejection Details & Reason/g, 'Retailer Rejection Details & Reason') // Outgoing for dist is to retailer

fs.writeFileSync(distributorPath, distContent);

// Retailer Replacements
let retContent = content
  .replace(/ProcessorShipmentsPage/g, 'RetailerShipmentsPage')
  .replace(/Seed2Shelf Processor/g, 'Seed2Shelf Retailer')
  .replace(/Processor B2B incoming farmer deliveries and outgoing distributor shipments\./g, 'Retailer B2B incoming distributor deliveries and outgoing customer shipments.')
  .replace(/\(Farmer -> Processor\)/g, '(Distributor -> Retailer)')
  .replace(/\(Processor -> Distributor\)/g, '(Retailer -> Store/Customer)')
  .replace(/activeSignal === "INCOMING" \? "Farmer Hub" : "Processor Hub"/g, 'activeSignal === "INCOMING" ? "Distributor Hub" : "Retail Hub"')
  .replace(/Processor Rejection Details & Reason/g, 'Distributor Rejection Details & Reason') // Incoming for ret is from dist
  .replace(/Distributor Rejection Details & Reason/g, 'Customer Rejection Details & Reason') // Outgoing for ret is to customer

fs.writeFileSync(retailerPath, retContent);

console.log("Done generating Shipments pages");
