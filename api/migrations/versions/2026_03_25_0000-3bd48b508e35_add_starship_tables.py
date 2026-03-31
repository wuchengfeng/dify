"""add_starship_tables

Revision ID: 3bd48b508e35
Revises: 6a88f7a2a27c
Create Date: 2026-03-25 00:00:00.000000

"""
from alembic import op
import models as models
import sqlalchemy as sa


def _is_pg(conn):
    return conn.dialect.name == "postgresql"


revision = '3bd48b508e35'
down_revision = '6a88f7a2a27c'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    uuid_default = sa.text('uuid_generate_v4()') if _is_pg(conn) else None
    ts_default = sa.text('CURRENT_TIMESTAMP') if _is_pg(conn) else sa.func.current_timestamp()

    def uuid_col(name, **kw):
        if _is_pg(conn):
            return sa.Column(name, models.types.StringUUID(), server_default=sa.text('uuid_generate_v4()'), **kw)
        return sa.Column(name, models.types.StringUUID(), **kw)

    # starship_members
    op.create_table(
        'starship_members',
        uuid_col('id', nullable=False),
        sa.Column('tenant_id', models.types.StringUUID(), nullable=False),
        sa.Column('account_id', models.types.StringUUID(), nullable=False),
        sa.Column('role', sa.String(32), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=ts_default, nullable=False),
        sa.PrimaryKeyConstraint('id', name='starship_members_pkey'),
        sa.UniqueConstraint('tenant_id', 'account_id', name='uq_starship_member_tenant_account'),
    )
    op.create_index('sm_tenant_idx', 'starship_members', ['tenant_id'])

    # starship_agent_versions
    op.create_table(
        'starship_agent_versions',
        uuid_col('id', nullable=False),
        sa.Column('tenant_id', models.types.StringUUID(), nullable=False),
        sa.Column('app_id', models.types.StringUUID(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('agent_config_snapshot', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(32), nullable=False, server_default='draft'),
        sa.Column('submitted_by', models.types.StringUUID(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', models.types.StringUUID(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('review_comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=ts_default, nullable=False),
        sa.PrimaryKeyConstraint('id', name='starship_agent_versions_pkey'),
    )
    op.create_index('sav_app_version_idx', 'starship_agent_versions', ['app_id', 'version_number'])
    op.create_index('sav_tenant_idx', 'starship_agent_versions', ['tenant_id'])

    # starship_groups
    op.create_table(
        'starship_groups',
        uuid_col('id', nullable=False),
        sa.Column('tenant_id', models.types.StringUUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('created_by', models.types.StringUUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=ts_default, nullable=False),
        sa.PrimaryKeyConstraint('id', name='starship_groups_pkey'),
    )
    op.create_index('sg_tenant_idx', 'starship_groups', ['tenant_id'])

    # starship_group_members
    op.create_table(
        'starship_group_members',
        uuid_col('id', nullable=False),
        sa.Column('group_id', models.types.StringUUID(), nullable=False),
        sa.Column('account_id', models.types.StringUUID(), nullable=False),
        sa.Column('role', sa.String(32), nullable=False, server_default='member'),
        sa.Column('created_at', sa.DateTime(), server_default=ts_default, nullable=False),
        sa.PrimaryKeyConstraint('id', name='starship_group_members_pkey'),
        sa.UniqueConstraint('group_id', 'account_id', name='uq_starship_group_member'),
    )
    op.create_index('sgm_group_idx', 'starship_group_members', ['group_id'])

    # starship_group_agents
    op.create_table(
        'starship_group_agents',
        uuid_col('id', nullable=False),
        sa.Column('group_id', models.types.StringUUID(), nullable=False),
        sa.Column('app_id', models.types.StringUUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=ts_default, nullable=False),
        sa.PrimaryKeyConstraint('id', name='starship_group_agents_pkey'),
        sa.UniqueConstraint('group_id', 'app_id', name='uq_starship_group_agent'),
    )
    op.create_index('sga_group_idx', 'starship_group_agents', ['group_id'])


def downgrade():
    op.drop_table('starship_group_agents')
    op.drop_table('starship_group_members')
    op.drop_table('starship_groups')
    op.drop_table('starship_agent_versions')
    op.drop_table('starship_members')
