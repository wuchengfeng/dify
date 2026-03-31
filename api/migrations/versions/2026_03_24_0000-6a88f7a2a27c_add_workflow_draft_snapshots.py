"""add_workflow_draft_snapshots

Revision ID: 6a88f7a2a27c
Revises: fecff1c3da27
Create Date: 2026-03-24 00:00:00.000000

"""
from alembic import op
import models as models
import sqlalchemy as sa


def _is_pg(conn):
    return conn.dialect.name == "postgresql"


# revision identifiers, used by Alembic.
revision = '6a88f7a2a27c'
down_revision = 'e288952f2994'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    if _is_pg(conn):
        op.create_table(
            'workflow_draft_snapshots',
            sa.Column('id', models.types.StringUUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
            sa.Column('tenant_id', models.types.StringUUID(), nullable=False),
            sa.Column('app_id', models.types.StringUUID(), nullable=False),
            sa.Column('graph', sa.Text(), nullable=False),
            sa.Column('created_by', models.types.StringUUID(), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id', name='workflow_draft_snapshots_pkey'),
        )
    else:
        op.create_table(
            'workflow_draft_snapshots',
            sa.Column('id', models.types.StringUUID(), nullable=False),
            sa.Column('tenant_id', models.types.StringUUID(), nullable=False),
            sa.Column('app_id', models.types.StringUUID(), nullable=False),
            sa.Column('graph', sa.Text(), nullable=False),
            sa.Column('created_by', models.types.StringUUID(), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
            sa.PrimaryKeyConstraint('id', name='workflow_draft_snapshots_pkey'),
        )

    op.create_index('wds_app_created_idx', 'workflow_draft_snapshots', ['app_id', 'created_at'])


def downgrade():
    op.drop_index('wds_app_created_idx', table_name='workflow_draft_snapshots')
    op.drop_table('workflow_draft_snapshots')
