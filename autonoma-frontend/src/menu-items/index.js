
import { masters } from './master';
import { hrms } from './hra';
import { sales } from './sales';
import { purchase } from './purchase';
import { production } from './production';
import { storelogistics } from './storelogistics';
import { finance } from './finance';
import { designdev } from './designdev';
import { maintenance } from './maintenance';
import { qms } from './qms';
import { qmt } from './qmt';
import { quality } from './quality';
import { reports } from './reports';
import { support } from './support';
import dashboard from './dashboard';
import employeeselfcare from './employeeSelfCare';
import clientManagement from './clientManagement';


// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [

    masters,
    hrms,
    sales,
    purchase,
    production,
    storelogistics,
    quality,
    finance,
    designdev,
    maintenance,
    qms,
    reports,
    employeeselfcare,
    dashboard,
    support, clientManagement
  ]
};

export default menuItems;
