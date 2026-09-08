import type { SupabaseClient } from '@supabase/supabase-js';

export type TenantAccessRecord = {
	id: string;
	slug: string;
	role: 'owner' | 'admin' | 'member';
};

/** Resolve the owner's workspace first, then a future team membership. */
export async function findTenantForUser(admin: SupabaseClient, userId: string): Promise<TenantAccessRecord | null> {
	const { data: owned } = await admin.from('tenants').select('id, slug').eq('owner_id', userId).maybeSingle();
	if (owned) return { ...(owned as Omit<TenantAccessRecord, 'role'>), role: 'owner' };

	const { data: membership } = await admin
		.from('tenant_members')
		.select('tenant_id, role')
		.eq('user_id', userId)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();
	if (!membership?.tenant_id) return null;

	const { data: tenant } = await admin.from('tenants').select('id, slug').eq('id', membership.tenant_id).maybeSingle();
	if (!tenant || !['owner', 'admin', 'member'].includes(membership.role)) return null;
	return { ...(tenant as Omit<TenantAccessRecord, 'role'>), role: membership.role as TenantAccessRecord['role'] };
}
