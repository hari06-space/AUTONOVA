// third party
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// project imports
import snackbarReducer from './slices/snackbar';
import customerReducer from './slices/customer';
import contactReducer from './slices/contact';
import productReducer from './slices/product';
import chatReducer from './slices/chat';
import calendarReducer from './slices/calendar';
import mailReducer from './slices/mail';
import userReducer from './slices/user';
import cartReducer from './slices/cart';
import kanbanReducer from './slices/kanban';
import searchReducer from './slices/search';
import permissionsReducer from './slices/permissions';
import notificationsReducer from './slices/notifications';

// ==============================|| COMBINE REDUCER ||============================== //

// NOTE (performance): Only `cart` is persisted to localStorage.
// Persisting chat/mail/kanban/calendar caused two problems:
//   1. App boot was slow — large stale JSON had to be deserialised from localStorage
//      on every page load before React could render anything.
//   2. Data was stale — users saw old kanban cards / chat messages until the network
//      response arrived, creating a jarring "flash of stale content".
// These slices now always start fresh from the server on each session.

const reducer = combineReducers({
  snackbar: snackbarReducer,
  // Cart is the only slice worth persisting — users expect their cart to survive
  // a page reload or accidental browser close.
  cart: persistReducer(
    {
      key: 'cart',
      storage,
      keyPrefix: 'berry-'
    },
    cartReducer
  ),
  kanban: kanbanReducer,
  customer: customerReducer,
  contact: contactReducer,
  product: productReducer,
  chat: chatReducer,
  calendar: calendarReducer,
  mail: mailReducer,
  user: userReducer,
  search: searchReducer,
  permissions: permissionsReducer,
  notifications: notificationsReducer,
});

export default reducer;
