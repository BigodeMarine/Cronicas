"""Shared comments on journal entries."""
from alembic import op
import sqlalchemy as sa

revision = "d42b8e930002"
down_revision = "c31a9d820001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("entry_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entry_id", sa.Integer(), sa.ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_entry_comments_entry_id", "entry_comments", ["entry_id"])


def downgrade():
    op.drop_table("entry_comments")
