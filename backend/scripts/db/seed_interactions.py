"""Seed database with test users and interactions for recommendation testing."""

import sys
import os
import random
from datetime import datetime, timezone

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.models.user_interaction import UserInteraction
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_test_users_and_interactions():
    """Seed database with test users and their interactions."""
    
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("  🌱 SEEDING TEST USERS & INTERACTIONS")
        print("=" * 70 + "\n")
        
        # Check if books exist
        books = db.query(Book).all()
        if not books:
            print("❌ No books found! Please run seed_books.py first.")
            return
        
        print(f"✅ Found {len(books)} books in database\n")
        
        # Create test users with different preferences
        test_users = [
            {
                "email": "dystopia_fan@test.com",
                "password": "test123",
                "full_name": "Dystopia Fan",
                "preferences": {
                    "genres": ["Dystopian", "Science Fiction"],
                    "authors": ["George Orwell", "Aldous Huxley", "Ray Bradbury"],
                    "interaction_types": ["like", "purchase"]
                }
            },
            {
                "email": "fantasy_lover@test.com",
                "password": "test123",
                "full_name": "Fantasy Lover",
                "preferences": {
                    "genres": ["Fantasy", "Adventure"],
                    "authors": ["J.R.R. Tolkien", "J.K. Rowling", "C.S. Lewis"],
                    "interaction_types": ["like", "cart", "view"]
                }
            },
            {
                "email": "classic_reader@test.com",
                "password": "test123",
                "full_name": "Classic Reader",
                "preferences": {
                    "genres": ["Classic", "Fiction"],
                    "authors": ["Jane Austen", "F. Scott Fitzgerald"],
                    "interaction_types": ["like", "view"]
                }
            },
            {
                "email": "thriller_seeker@test.com",
                "password": "test123",
                "full_name": "Thriller Seeker",
                "preferences": {
                    "genres": ["Mystery", "Thriller", "Crime"],
                    "authors": ["Dan Brown", "Stieg Larsson", "Gillian Flynn"],
                    "interaction_types": ["purchase", "like", "cart"]
                }
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                print(f"⚠️  User {user_data['email']} already exists, skipping...")
                created_users.append(existing_user)
                continue
            
            # Create new user
            hashed_password = pwd_context.hash(user_data["password"])
            user = User(
                email=user_data["email"],
                password_hash=hashed_password,
                full_name=user_data["full_name"],
                is_admin=False
            )
            
            db.add(user)
            db.flush()  # Flush to get user ID
            
            print(f"✅ Created user: {user.email}")
            
            # Create interactions based on preferences
            prefs = user_data["preferences"]
            favorite_genres = prefs["genres"]
            favorite_authors = prefs["authors"]
            interaction_types = prefs["interaction_types"]
            
            # Find books matching user preferences
            matching_books = [
                book for book in books
                if (any(genre in (book.genres or []) for genre in favorite_genres) or
                    book.author in favorite_authors)
            ]
            
            if matching_books:
                # Create interactions for random books (1 to min(10, available))
                max_interactions = min(10, len(matching_books))
                num_interactions = random.randint(1, max(1, max_interactions))
                selected_books = random.sample(matching_books, num_interactions)
                
                interactions_created = 0
                for book in selected_books:
                    interaction_type = random.choice(interaction_types)
                    
                    # Check if interaction already exists
                    existing_interaction = db.query(UserInteraction).filter(
                        UserInteraction.user_id == user.id,
                        UserInteraction.book_id == book.id,
                        UserInteraction.interaction_type == interaction_type
                    ).first()
                    
                    if not existing_interaction:
                        interaction = UserInteraction(
                            user_id=user.id,
                            book_id=book.id,
                            interaction_type=interaction_type
                        )
                        db.add(interaction)
                        interactions_created += 1
                
                print(f"   → Created {interactions_created} interactions")
            
            created_users.append(user)
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 70)
        print("  ✅ SEED COMPLETED SUCCESSFULLY!")
        print("=" * 70 + "\n")
        
        # Summary
        print("📊 SUMMARY:")
        print(f"  • Total users: {len(created_users)}")
        
        for user in created_users:
            interaction_count = db.query(UserInteraction).filter(
                UserInteraction.user_id == user.id
            ).count()
            print(f"  • {user.email}: {interaction_count} interactions")
        
        print("\n📝 TEST CREDENTIALS:")
        print("  Email: dystopia_fan@test.com")
        print("  Password: test123")
        print("\n  (All test users have password: test123)")
        
        print("\n🧪 NOW YOU CAN RUN:")
        print("  python -m scripts.test_recommendations")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR seeding data: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_test_users_and_interactions()
