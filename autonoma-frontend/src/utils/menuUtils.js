/**
 * Recursively filter menu items based on permission flags.
 * - type 'item' with a pageCode: hidden if enable === false
 * - type 'collapse': recursively filter children, hidden if all children removed
 * - type 'group': recursively filter children, hidden if all children removed
 * - Items without a pageCode: always visible (backwards compatible)
 */
export function filterMenuByPermissions(items, permMap, userLevel = 0, user = null) {
  if (!items || !Array.isArray(items)) return [];

  // Super Admin (5) bypasses authorization completely and renders the full hardcoded menu
  if (userLevel === 5) {
    return items;
  }

  return items
    .map((item) => {
      // 1. Pages (type 'item')
      if (item.type === 'item') {
        if (!item.pageCode) return null; // hide if no page code
        
        // Show only if pageCode is enabled in permMap
        const pagePerm = permMap?.[item.pageCode];
        if (!pagePerm || !pagePerm.enable) return null;
        
        return item;
      }

      // 2. Sub Modules / Main Modules (type 'collapse' or 'group')
      if ((item.type === 'collapse' || item.type === 'group') && item.children) {
        const filteredChildren = filterMenuByPermissions(item.children, permMap, userLevel, user);
        // Hide entire group/collapse if all children are filtered out (recursively removes empty modules/sub-modules)
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      return item;
    })
    .filter(Boolean);
}
