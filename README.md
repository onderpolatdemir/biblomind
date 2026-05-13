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

*(Insert your screenshots/GIFs below to make this repository stand out to recruiters and developers!)*

### 1. The Biblomind Homepage & Dashboard

> **📸 Add a screenshot here:** `![Homepage Dashboard](./static/uploads/screenshots/login.mp4)`
> *Suggestion: Show the sleek user interface, ideally highlighting the rich design, vibrant colors, and personalized welcome section.*

### 2. AI Photo-Based Bookshelf Scanner

> **🎞️ Add a GIF here:** `![Bookshelf Scanner](./static/uploads/screenshots/photo.mp4`)
> *Suggestion: A 5-10 second GIF of a user uploading a photo of a bookshelf, the UI showing a "Scanning..." animation, and then revealing the recommended books.*

### 4. Biblomind Social Feed

> **📸 Add a screenshot here:** `![Social Feed](./static/uploads/screenshots/social.mp4`
> *Suggestion: Show the community feed, including posts, likes, comments, and the user profile sidebar.*
>

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
