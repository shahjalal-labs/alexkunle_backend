# 📺 Alex Kunle — Live Stream Commerce, Real-Time Bidding Auctions & Ad Campaign Engine

![Architecture Banner](./assets/banner.svg)

<p align="center">
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e9b01561-25f5-4221-9e30-6ac337c8a1c5" target="_blank">
    <img src="https://run.pstmn.io/button.svg" alt="View in Postman" />
  </a>
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e9b01561-25f5-4221-9e30-6ac337c8a1c5" target="_blank">
    <img src="https://img.shields.io/badge/Postman-Instant_Live_API_Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Live API Documentation" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Live_Commerce-F97316?style=for-the-badge&logo=youtube&logoColor=white" alt="Live_Commerce" />
  <img src="https://img.shields.io/badge/Auctions-8B5CF6?style=for-the-badge&logo=dollar-sign&logoColor=white" alt="Auctions" />
  
</p>

---

## 📌 Executive Overview

**Alex Kunle Backend** is a next-generation interactive live commerce and digital auction platform engine. Engineered with **Node.js, TypeScript, Express, and Prisma ORM**, the system powers modern creator commerce: **interactive live shopping broadcasts**, **real-time competitive product bidding auctions**, merchant **ad campaign management** (Brand Awareness, Traffic, Conversions) with placement targeting, tokenized wallet transactions, and automated order autopilot fulfillment.

---

## 🚀 Key Architectural & Domain Capabilities

- **Interactive Live Stream Shopping**: Broadcaster live streams (`LiveStream`) with linked product showcases and real-time chat rooms.
- **Competitive Bidding Auction Engine**: Timed auctions (`Auction`) with incrementing bid validations (`Bid`), anti-sniping logic, and winner determination.
- **Merchant Ad Campaign Manager**: Create sponsored merchant campaigns (`Campaign`) specifying budgets, durations, and targeted feed placements.
- **Order Autopilot & Inventory Sync**: Automated fulfillment routing queues and inventory locking across concurrent live purchase streams.
- **Token Wallet & Point Economy**: In-app wallet ledger supporting token purchases, rewards, transfers, and seller balance cash-outs.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore alexkunle_backend in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e9b01561-25f5-4221-9e30-6ac337c8a1c5)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (ready for Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | Creator and buyer onboarding, referral code reward tracking, JWT security |
| **Live Streams** | `/api/v1/livestream` | Broadcast scheduling, product tag pinning, live session metrics |
| **Auctions & Bidding** | `/api/v1/auction` | Create timed auctions, place real-time bids, auction settlement |
| **Ad Campaigns** | `/api/v1/campaign` | Sponsor listing campaigns, objective configuration, budget tracking |
| **Catalog & Products** | `/api/v1/product` | Product SKUs, variations, inventory counts, merchant collections |
| **Token & Wallet** | `/api/v1/wallet` | Token balance ledger, top-up transactions, seller withdrawal requests |

---

## 📂 Project Architecture

```plaintext
alexkunle_backend/
├── assets/
│   └── banner.svg               # Architectural visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain feature modules
│   │   └── routes/              # Centralized route registration
│   ├── config/                  # Environment & external service configurations
│   └── server.ts                # Application bootstrapper
├── prisma/
│   └── schema.prisma            # Prisma database schema definition
├── .env.example                 # Sanitized environment template
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **Database**: MongoDB or PostgreSQL (as specified in `schema.prisma`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shahjalal-labs/alexkunle_backend.git
cd alexkunle_backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and engineered by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
