# Seed2Shelf

## Project Overview

Seed2Shelf is a blockchain based agricultural supply chain traceability and marketplace platform built to close the trust gap between farmers, processors, distributors, retailers, and consumers. The platform records every transaction and handoff of produce on chain, so the full journey of a product from harvest to shelf can be verified by anyone in seconds through a QR code scan.

## The Problem

By the time produce leaves the field, it has typically passed through four to six middlemen and has been mixed with produce from thousands of other small farms, making it impossible to determine its true origin. Present day tracking only captures price and quantity at the mandi level, with no verification of claims such as organic certification or Geographical Indication tags for products like Basmati rice, Alphonso mangoes, or Darjeeling tea.

This problem affects a very large share of the population. Agriculture employs 46 percent of India's workforce, and agricultural exports reached approximately ₹4.25 lakh crore (around 51.1 billion US dollars) in financial year 2025. International buyers in the European Union, the United States, and the Gulf region increasingly demand verifiable proof of origin, which the current system cannot fully provide. Government infrastructure such as AgriStack, e NAM, FSSAI, and APEDA already exists, but lacks the missing piece of a record that cannot be faked or altered.

The people most affected include small and marginal farmers, who make up 86 percent of all farmers, along with more than 10,000 Farmer Producer Organizations that grow organic or geographically certified produce but have no way to prove its authenticity, allowing middlemen to capture the resulting price premium instead of the farmers themselves. Consumers pay extra for products labeled organic with no way to confirm the claim, and exporters risk losing shipments at international borders when they cannot produce the documentation that buyers now expect.

## Solution and Innovation

Seed2Shelf is designed as a blockchain based marketplace rather than a simple tracking tool. Its core components are described below.

### Blockchain Based Marketplace

All five stakeholder groups, namely farmers, processors, distributors, retailers, and consumers, can buy and sell produce directly on the platform. Every transaction is executed through smart contracts, so the recorded journey of a product is built from real transactions rather than manually entered data.

### Verified Onboarding

Before any stakeholder can transact on the platform, they must be verified against documents they already legally hold. Farmers are verified using Aadhaar, land records, and Kisan Credit Card details. Processors, distributors, and retailers are verified using FSSAI registration, GST registration, and APEDA credentials. This ensures that every wallet on the platform is tied to a real, accountable entity, closing the loophole of fake identities and fraudulent participants.

### Smart Contract Escrow

Payments are held in escrow and released automatically once agreed conditions are met, so farmers are paid without delay once the terms of a sale are satisfied. This directly addresses the leverage that middlemen currently hold over farmers, rather than simply making the problem more visible.

### End to End Price and Ownership Transparency

Every sale is recorded on the blockchain, meaning that the price at each stage of the supply chain is visible from farm to shelf. This exposes exactly where markup occurs between the original farmer and the final consumer.

### Consumer Verification

A consumer can scan a QR code on a product and see its complete, tamper proof ownership and pricing history in under five seconds, without needing to change any existing shopping behavior.

### Supply Chain Flow

The platform models the produce journey through the following stages: the farmer harvests the crop, a grain elevator or storage facility stores the produced crop, a grain processor refines it into a final product, a distributor receives the final product and ships it onward to dealers or retailers, a retailer buys and sells the product in smaller quantities to customers, and the end customer consumes the final product.

## Market Opportunity

### Market Validation

The agricultural sector contributed ₹52.09 lakh crore to India's Gross Value Added in 2025 to 2026. Fifty five percent of India's population depends on agriculture for their livelihood. Eighty six percent of farmers are classified as small or marginal, meaning they hold less than two hectares of land. More than 10,000 Farmer Producer Organizations exist and can serve as a channel for scalable onboarding onto the platform.

### Digital Readiness

The existing e NAM platform has recorded ₹4.84 lakh crore in cumulative trade, with 1.80 crore farmers and 2.73 lakh traders registered, and 1,656 mandis connected to the system. A new version, e NAM 2.0, launched in 2026, further improving the digital foundation that Seed2Shelf can build upon.

### Market Sizing

The Total Addressable Market is estimated at ₹52 lakh crore in gross merchandise value. The Serviceable Addressable Market is estimated at ₹13 lakh crore in gross merchandise value. The Serviceable Obtainable Market for years three through five is estimated at ₹2,500 to ₹3,000 crore in gross merchandise value, calculated conservatively assuming a one percent transaction fee.

## Business Model

Seed2Shelf generates revenue through five channels.

1. Transaction Fee: a commission of 0.5 to 1 percent is charged on every successful trade between stakeholders. Because this scales with transaction volume, it functions as a highly scalable income source.
2. Kisan Rath Logistics Partnership: the platform integrates with the Kisan Rath transportation service and includes a service fee within the delivery charge, earning a percentage on every shipment. Revenue grows as delivery volume grows.
3. Premium Analytics Dashboard: processors, distributors, and retailers can subscribe to access price trends, demand forecasts, inventory insights, and supply chain analytics, providing a recurring subscription revenue stream.
4. Smart Contract Escrow Fee: a small fee is charged for secure escrow based payments and automated settlement between buyers and sellers, providing consistent fee revenue tied to transaction security.
5. Market Intelligence Reports: anonymized, data driven reports covering crop prices, trade volumes, demand patterns, and regional supply trends are sold to agribusinesses, banks, insurers, and researchers.

The guiding principle behind the business model is summarized as transparent, trusted, and traceable.

## Project Architecture

The application backend lives inside the same Next.js application through API routes under pages/api, rather than as a separate standalone service, in order to keep authentication, deployment, and session handling unified.

The frontend is organized by user role, with each of the six roles receiving its own portal, referred to internally as a Hub, along with its own profile and wallet pages covering balance, invoices, and transactions.

Shared and reusable frontend elements live under a common components folder, containing items such as the modal, navigation bar, sidebar, and profile controls, alongside a shared components folder containing items used across multiple roles such as cards and chat. Role specific components live in their own folders.

Layout wrappers include an Admin layout for the admin hub, a general dashboard layout for the Farmer, Distributor, Processor, and Retailer hubs, and a public layout for pages such as home, authentication, and the public trace lookup page.

Business logic is abstracted into a services layer covering authentication, blockchain interaction, notifications, orders, payments, user profiles, shipments, file uploads, and wallets, keeping this logic separate from the user interface components.

## Implementation Plan

### Phase One: Pilot, Zero to Six Months

The pilot phase launches in a single state and a single crop category, chosen for strong Farmer Producer Organization density and existing digital agricultural infrastructure. Two to three Farmer Producer Organizations are onboarded along with a small number of processors, distributors, and one retailer, forming a complete chain from farmer to consumer. The core smart contract flow of listing, purchase, escrow, ownership transfer, and QR code generation is built and tested during this phase. Document based onboarding using Aadhaar, land records, FSSAI, and GST is validated early, as it represents the highest risk step in the process.

### Phase Two: Regional Expansion, Six to Eighteen Months

This phase scales onboarding to additional Farmer Producer Organizations and two to three additional states. A regional language, low bandwidth mobile application is launched for farmers. Escrow based payments and certification premium revenue features are activated. APEDA registered processors are onboarded to enable export documentation.

### Phase Three: National Scale, Eighteen Months and Beyond

The platform expands nationally, prioritizing regions by Farmer Producer Organization density and export value. Integration with AgriStack and e NAM 2.0 positions Seed2Shelf as complementary to existing government infrastructure, in alignment with NITI Aayog's broader digital agriculture goals. The data and analytics revenue line is activated at scale, and state government co funded onboarding is pursued, following a funding model similar to that used by PM Kisan SAMPADA for processing infrastructure.

The long term goal guiding all three phases is building a transparent, inclusive, and traceable agricultural value chain, from the individual farmer to the global market.


### Links
