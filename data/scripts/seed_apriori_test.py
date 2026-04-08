import sys
from pathlib import Path
import random
from uuid import uuid4

# Setup sys path to import backend modules
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.models.order import Order, OrderItem, OrderStatus

def seed_test_transactions():
    db = SessionLocal()
    try:
        # 1. Create a few fake users
        users = []
        for i in range(5):
            u_name = f"Apriori_Tester_{uuid4().hex[:6]}"
            user = User(
                email=f"{u_name}@test.com",
                password_hash="fake",
                full_name=u_name
            )
            db.add(user)
            users.append(user)
            
        db.commit()
        
        # 2. Pick 3 real books to form our "Highly Associated Basket"
        books = db.query(Book).limit(3).all()
        if len(books) < 3:
            print("Not enough books in DB for test.")
            return
            
        book_a, book_b, book_c = books[0], books[1], books[2]
        
        print(f"Creating associated orders for:")
        print(f"Book A: {book_a.title}")
        print(f"Book B: {book_b.title}")
        print(f"Book C: {book_c.title}")
        
        # 3. Create Orders. 4 out of 5 users will buy Book A and Book B together! 
        # (Very high confidence/support)
        for i, user in enumerate(users):
            order = Order(
                user_id=user.id,
                subtotal=50.0,
                total_price=50.0,
                status=OrderStatus.PAID
            )
            db.add(order)
            db.commit()
            
            # User 0, 1, 2, 3 buy Book A and Book B
            if i < 4:
                item_a = OrderItem(order_id=order.id, book_id=book_a.id, book_title=book_a.title, quantity=1, price=25, subtotal=25)
                item_b = OrderItem(order_id=order.id, book_id=book_b.id, book_title=book_b.title, quantity=1, price=25, subtotal=25)
                db.add_all([item_a, item_b])
                
            # User 4 buys Book A and Book C
            if i == 4:
                item_a = OrderItem(order_id=order.id, book_id=book_a.id, book_title=book_a.title, quantity=1, price=25, subtotal=25)
                item_c = OrderItem(order_id=order.id, book_id=book_c.id, book_title=book_c.title, quantity=1, price=25, subtotal=25)
                db.add_all([item_a, item_c])
                
        db.commit()
        print("Successfully seeded test transactions! Book A and Book B are highly associated.")
    except Exception as e:
        print("Error details:", e)
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_transactions()
