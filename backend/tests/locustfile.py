"""
Locust load testing configuration for BiblioMind API.

Tests system performance under concurrent user load.

Usage:
    # Interactive mode
    locust -f backend/tests/locustfile.py --host=http://localhost:8000
    
    # Headless mode
    locust -f backend/tests/locustfile.py --host=http://localhost:8000 \
           --users 100 --spawn-rate 10 --run-time 5m --headless
"""

from locust import HttpUser, task, between
import random


class BiblioMindUser(HttpUser):
    """Simulated user behavior for load testing."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Login user before starting tasks."""
        # Register or login
        response = self.client.post(
            "/api/auth/login",
            data={
                "username": f"loadtest{random.randint(1, 100)}@example.com",
                "password": "test123456"
            },
            catch_response=True
        )
        
        if response.status_code == 401:
            # Register new user
            response = self.client.post(
                "/api/auth/register",
                json={
                    "email": f"loadtest{random.randint(1, 100)}@example.com",
                    "password": "test123456",
                    "full_name": "Load Test User"
                }
            )
        
        if response.status_code in [200, 201]:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(5)
    def browse_books(self):
        """Browse books list (most common operation)."""
        page = random.randint(1, 5)
        self.client.get(
            f"/api/books?page={page}&page_size=20",
            headers=self.headers
        )
    
    @task(3)
    def view_book_detail(self):
        """View book details."""
        # Get random book first
        response = self.client.get("/api/books?page=1&page_size=20")
        if response.status_code == 200:
            books = response.json().get("books", [])
            if books:
                book_id = books[random.randint(0, len(books)-1)]["id"]
                self.client.get(f"/api/books/{book_id}", headers=self.headers)
    
    @task(2)
    def search_books(self):
        """Search for books."""
        queries = ["1984", "fantasy", "mystery", "tolkien", "science fiction"]
        query = random.choice(queries)
        self.client.get(
            f"/api/books/search?q={query}&limit=10",
            headers=self.headers
        )
    
    @task(2)
    def get_recommendations(self):
        """Get personalized recommendations."""
        if not self.token:
            return
        
        self.client.get(
            "/api/recommendations?strategy=hybrid&limit=5",
            headers=self.headers
        )
    
    @task(1)
    def chat_message(self):
        """Send chat message."""
        if not self.token:
            return
        
        messages = [
            "1984 kitabını okumak istiyorum",
            "Bana fantastik kitap öner",
            "En popüler kitaplar neler?",
            "Bilim kurgu kitap arıyorum"
        ]
        
        self.client.post(
            "/api/chat/message",
            json={"message": random.choice(messages)},
            headers=self.headers
        )
    
    @task(1)
    def find_buddies(self):
        """Find book buddies."""
        if not self.token:
            return
        
        self.client.get(
            "/api/social/find-buddies?limit=5",
            headers=self.headers
        )


class QuickTest(HttpUser):
    """Quick smoke test for critical endpoints."""
    
    wait_time = between(0.5, 1)
    
    @task
    def health_check(self):
        """Test health endpoint."""
        self.client.get("/api/health")


if __name__ == "__main__":
    import os
    os.system("locust -f backend/tests/locustfile.py --host=http://localhost:8000")
