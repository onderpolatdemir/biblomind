import os
import sys

# Setting up django/fastapi path correctly
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.user_interaction import UserInteraction
from app.models.book import Book

db = SessionLocal()
user = db.query(User).filter(User.email == 'pltdmr@gmail.com').first()
print(f"User: {user.email}")
print(f"Has Vector: {user.preferences_vector is not None}")

# Check interactions
interactions = db.query(UserInteraction).filter(UserInteraction.user_id == user.id, UserInteraction.interaction_type == 'like').all()
print(f"Like Interactions: {len(interactions)}")

for i in interactions:
    b = db.query(Book).filter(Book.id == i.book_id).first()
    print(f" - {b.title} by {b.author}, Has Embedding: {b.embedding is not None}")
