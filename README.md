<h1 align="center">
  📚 Biblomind: AI-Powered Book Discovery & Social Platform
</h1>

<p align="center">
  <em>An intelligent, full-stack ecosystem for book lovers, combining advanced recommendation algorithms, AI vision, interactive Q&A, and social networking.</em>
</p>

---

## 📖 Overview

**Biblomind** is not just another digital bookstore—it is a comprehensive, AI-driven platform built to revolutionize how users discover, interact with, and purchase books. Designed with a microservice-oriented backend and a dynamic frontend, Biblomind merges e-commerce with social networking and cutting-edge Artificial Intelligence.

Whether it's scanning a physical bookshelf to recommend your next read, answering deep questions about a book's universe using a Knowledge Graph RAG pipeline, or matching you with readers who share your niche tastes, Biblomind provides a highly personalized, state-of-the-art user experience.

---

## ✨ Key Features

### 1. 🧠 Hybrid Recommendation Engine

Our recommendation system goes far beyond simple genre matching. It utilizes a hybrid approach:

- **Content-Based & User History:** Analyzes past reading history, favorite authors, and genre affinities.
- **Association Rules (Apriori Algorithm):** Powers our "Frequently Bought Together" engine by mining transaction datasets to discover hidden relationships between books.
- **Jitter & Randomization:** Ensures users don't get stuck in a "filter bubble" by introducing calculated, serendipitous recommendations.

### 2. 📸 AI Photo-Based Bookshelf Analysis

Users can upload a picture of any physical bookshelf. Using **Computer Vision (Google Vision API)**, the system identifies the books they own, extracts their semantic data, and instantly generates personalized book suggestions that complement their existing physical library.

### 3. 🌐 Biblomind Social Hub

A fully integrated community platform for readers to connect:

- **Communities & Forums:** Users can create and join niche book clubs.
- **Interactions:** Full support for creating posts, commenting, upvoting/liking, and saving discussions.
- **Role Management:** Admin, moderator, and user roles dynamically handled via robust PostgreSQL schemas.

### 4. 🔍 Resilient Search Architecture

Built to never fail. The primary search engine utilizes **Elasticsearch** for lightning-fast, typo-tolerant full-text search. If the Elasticsearch service experiences downtime, the system automatically and seamlessly falls back to a **PostgreSQL full-text search**, guaranteeing zero disruption for the user.

### 5. 💳 E-Commerce & Secure Checkout

A complete end-to-end shopping experience integrated with the **Iyzico** payment gateway. It securely processes transactions, handles shopping carts, and manages user billing/shipping addresses.

---

## 💻 Technology Stack

**Frontend:**

* **Framework:** Next.js, React
* **Language:** TypeScript
* **Styling:** Modern CSS / UI Components

**Backend:**

* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL (Core Data), Elasticsearch (Search)
* **AI/ML:** Ollama (LLM Embeddings), Google Vision API, LangChain
* **Payment:** Iyzico API

---

## 🖼️ Project Showcase

### 1. The Biblomind Homepage & Dashboard

https://github.com/user-attachments/assets/d372c4f5-889c-4813-9a6f-1351750eb29d

### 2. AI Photo-Based Bookshelf Scanner

https://github.com/user-attachments/assets/bbb99684-3f73-4024-84f5-88b284baff6c

### 4. Reccommendation Page

https://github.com/user-attachments/assets/a196a113-8f3e-4fcd-8900-87901dc7a2a5

### 5. Biblomind Social Feed
https://github.com/user-attachments/assets/1604f878-3602-49ac-83f4-3fcbf1921271


## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Python (3.10+)
* PostgreSQL
* Elasticsearch (Optional, system will fallback to Postgres)
* Ollama (For running local LLM features)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
# Set up your .env file
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

*Developed as a Senior Design Project at Akdeniz Üniversitesi.*
