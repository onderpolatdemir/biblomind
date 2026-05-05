"""add_community_join_requests

Revision ID: c1d4e2f3a5b6
Revises: 87ce1cf9e12a
Create Date: 2026-05-05 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c1d4e2f3a5b6'
down_revision: Union[str, None] = '87ce1cf9e12a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    exists = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_join_requests')"
    )).scalar()
    if not exists:
        op.create_table(
            'community_join_requests',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('community_id', postgresql.UUID(as_uuid=True),
                      sa.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True),
                      sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('status', sa.String(10), nullable=False, server_default='pending'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.UniqueConstraint('community_id', 'user_id', name='uq_community_join_request'),
        )
        op.create_index('ix_community_join_requests_community_id', 'community_join_requests', ['community_id'])
        op.create_index('ix_community_join_requests_user_id', 'community_join_requests', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_community_join_requests_user_id', table_name='community_join_requests')
    op.drop_index('ix_community_join_requests_community_id', table_name='community_join_requests')
    op.drop_table('community_join_requests')
