# ⚡ Alex Kunle Engine — High-Velocity Order Autopilot & Inventory API

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
  <img src="https://img.shields.io/badge/Autopilot-F59E0B?style=for-the-badge&logo=zap&logoColor=white" alt="Autopilot" />
  
</p>

---

## 📌 Executive Overview

Alex Kunle Backend is a high-performance operational engine providing automated stock level reordering, order fulfillment autopilot workflows, multi-channel product shortlisting, and real-time inventory tracking.

---

## 🚀 Key Architectural Highlights

- **Order Autopilot**: Automated rule-based routing of incoming orders to fulfillment queues.
- **Dynamic Stock Sync**: Real-time stock reservation preventing inventory collisions across channels.
- **Shortlisting Engine**: Fast product bookmarking and curated collections for enterprise buyers.
- **Multi-Tenant Architecture**: Segregated vendor inventories and automated order dispatch.
- **Defensive Input Validation**: Zod schema enforcement across all 17 feature endpoints.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore alexkunle_backend in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e9b01561-25f5-4221-9e30-6ac337c8a1c5)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (import directly into Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Autopilot** | `/api/v1/autopilot` | Automated fulfillment triggers, rule-based dispatching |
| **Stock** | `/api/v1/stock` | Inventory tracking, low-stock threshold alerts, replenishment |
| **Orders** | `/api/v1/order` | Order lifecycle state machine, status notifications |
| **Products** | `/api/v1/product` | Catalog management, SKU generation, categorization |
| **Shortlists** | `/api/v1/shortlist` | Curated product sets and buyer procurement lists |

---

## 📂 Project Architecture

```plaintext
alexkunle_backend/
├── assets/
│   └── banner.svg               # Project architecture visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain-driven feature modules
│   │   └── routes/              # Centralized route aggregator
│   ├── config/                  # Environment & external service configurations
│   └── server.ts                # Application bootstrapper & HTTP server
├── prisma/
│   └── schema.prisma            # Database schema definition
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

### 2. Environment Configuration
Copy the provided `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and maintained by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
