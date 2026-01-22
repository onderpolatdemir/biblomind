"""add performance indexes for phase 3

Revision ID: 2fd626caa00a
Revises: 5575215cfab9
Create Date: 2026-01-22 17:07:10.561004

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fd626caa00a'
down_revision: Union[str, Sequence[str], None] = '5575215cfab9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for Phase 3 optimization."""
    
    # GIN index for books.genres (JSONB array search)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_books_genres_gin 
        ON books USING GIN (genres);
    """)
    
    # Indexes for user_interactions (frequent joins and filters)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_interactions_user_book 
        ON user_interactions (user_id, book_id);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_interactions_type 
        ON user_interactions (interaction_type);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at 
        ON user_interactions (created_at DESC);
    """)
    
    # Index for user_connections (social features)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_connections_score 
        ON user_connections (compatibility_score DESC);
    """)
    
    # Composite index for common queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_books_stock_price 
        ON books (stock, price) WHERE stock > 0;
    """)


def downgrade() -> None:
    """Remove performance indexes."""
    op.execute("DROP INDEX IF EXISTS idx_books_genres_gin;")
    op.execute("DROP INDEX IF EXISTS idx_user_interactions_user_book;")
    op.execute("DROP INDEX IF EXISTS idx_user_interactions_type;")
    op.execute("DROP INDEX IF EXISTS idx_user_interactions_created_at;")
    op.execute("DROP INDEX IF EXISTS idx_user_connections_score;")
    op.execute("DROP INDEX IF EXISTS idx_books_stock_price;")
