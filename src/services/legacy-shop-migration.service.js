'use strict';

const collectLegacyOwnerIds = ({ productOwnerIds = [], discountOwnerIds = [], shopIds = [] }) => {
  const knownShopIds = new Set(shopIds.map(String));
  return [...new Set([...productOwnerIds, ...discountOwnerIds].map(String))]
    .filter((ownerId) => !knownShopIds.has(ownerId));
};

const createLegacyShopPayload = (ownerId) => ({
  ownerId,
  name: `Legacy shop ${ownerId}`,
  slug: `legacy-${ownerId}`,
  status: 'active',
});

module.exports = { collectLegacyOwnerIds, createLegacyShopPayload };
