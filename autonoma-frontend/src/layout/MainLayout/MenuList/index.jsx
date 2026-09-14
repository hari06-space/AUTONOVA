import { memo, useLayoutEffect, useState, useEffect } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import { MenuOrientation } from 'config';
import menuItem from 'menu-items';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { useDispatch, useSelector } from 'store';
import { fetchUserPermissions, clearPermissions } from 'store/slices/permissions';

import { HORIZONTAL_MAX_ITEM } from 'config';
import { useGetMenu, useGetMenuMaster } from 'api/menu';
import { filterMenuByPermissions } from 'utils/menuUtils';

// ==============================|| SIDEBAR MENU LIST ||============================== //

function MenuList({ speedDialPreferences, altMode, groupsWithKeyTips }) {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const reduxDispatch = useDispatch();
  const { user } = useAuth();

  const {
    state: { menuOrientation }
  } = useConfig();
  const { menu, menuLoading } = useGetMenu();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  const [selectedID, setSelectedID] = useState('');
  const [menuItems, setMenuItems] = useState({ items: [] });

  // ── Fetch/Clear permissions on user.id change ──
  const permStatus = useSelector((state) => state.permissions.status);
  const permMap = useSelector((state) => state.permissions.map);

  useEffect(() => {
    const uid = user?.userId || user?.id;
    if (uid) {
      reduxDispatch(fetchUserPermissions(uid));
    } else {
      reduxDispatch(clearPermissions());
    }
  }, [user?.userId, user?.id, reduxDispatch]);

  // ── Build filtered menu items ──
  useLayoutEffect(() => {
    if (permStatus !== 'loaded') {
      setMenuItems({ items: [] });
      return;
    }

    let currentItems = filterMenuByPermissions([...menuItem.items], permMap, user?.userLevel || 0, user);
    setMenuItems({ items: currentItems });
  }, [menuLoading, menu, permStatus, permMap, user?.userLevel, user]);

  // last menu-item to show in horizontal menu bar
  const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;

  let lastItemIndex = menuItems.items.length - 1;
  let remItems = [];
  let lastItemId;

  if (lastItem && lastItem < menuItems.items.length) {
    lastItemId = menuItems.items[lastItem - 1].id;
    lastItemIndex = lastItem - 1;
    remItems = menuItems.items.slice(lastItem - 1, menuItems.items.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon,
      ...(item.url && {
        url: item.url
      })
    }));
  }

  const navItems = menuItems.items.slice(0, lastItemIndex + 1).map((item, index) => {
    switch (item.type) {
      case 'group':
        if (item.url && item.id !== lastItemId) {
          return (
            <List key={item.id}>
              <NavItem item={item} level={1} isParents />
              {menuOrientation === MenuOrientation.HORIZONTAL && <Divider orientation="vertical" variant="middle" flexItem />}
            </List>
          );
        }

        return (
          <NavGroup
            key={item.id}
            setSelectedID={setSelectedID}
            selectedID={selectedID}
            item={item}
            lastItem={lastItem}
            remItems={remItems}
            lastItemId={lastItemId}
            speedDialPreferences={speedDialPreferences}
            altMode={altMode}
            groupsWithKeyTips={groupsWithKeyTips}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  return !isHorizontal ? <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box> : <>{navItems}</>;
}

export default memo(MenuList);
