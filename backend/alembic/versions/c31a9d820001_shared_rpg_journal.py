"""Add shared RPG journal without replacing existing projects or tasks."""
from alembic import op
import sqlalchemy as sa

revision = "c31a9d820001"
down_revision = "87ff1d16d6ec"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("projects", sa.Column("system", sa.String(100), nullable=False, server_default=""))
    op.create_table("campaign_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("played_on", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False))
    op.create_index("ix_campaign_sessions_project_id", "campaign_sessions", ["project_id"])
    op.create_table("journal_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("campaign_sessions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_journal_entries_project_id", "journal_entries", ["project_id"])


def downgrade():
    op.drop_table("journal_entries")
    op.drop_table("campaign_sessions")
    op.drop_column("projects", "system")
