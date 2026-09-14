import type { SupabaseClient } from '@supabase/supabase-js';

export type OwnedTenantProduct = { id: string; maker_id: string; tenant_id: string; slug?: string; name?: string };

/** Resolve the product boundary used by integrations and repair legacy rows once. */
export async function ownedProductWithTenant(admin: SupabaseClient, productId: string, userId: string): Promise<OwnedTenantProduct | null> {
	const { data } = await admin.from('products').select('id, maker_id, tenant_id, slug, name').eq('id', productId).is('deleted_at', null).maybeSingle();
	if (!data || data.maker_id !== userId) return null;
	if (data.tenant_id) return data as OwnedTenantProduct;

	const { data: ensured, error: ensureError } = await admin.rpc('ensure_tenant_for_user', { p_user_id: userId });
	const tenantId = (ensured as { id?: string } | null)?.id;
	if (ensureError || !tenantId) return null;
	const { data: repaired, error: repairError } = await admin
		.from('products')
		.update({ tenant_id: tenantId, updated_at: new Date().toISOString() })
		.eq('id', productId)
		.eq('maker_id', userId)
		.select('id, maker_id, tenant_id, slug, name')
		.single();
	if (repairError || !repaired?.tenant_id) return null;
	return repaired as OwnedTenantProduct;
}
