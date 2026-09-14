export const DASHBOARD_PATH = '/dashboard/user-task-queue';
export const HORIZONTAL_MAX_ITEM = 20;

export const CSS_VAR_PREFIX = '';

export let MenuOrientation;

(function (MenuOrientation) {
  MenuOrientation['VERTICAL'] = 'vertical';
  MenuOrientation['HORIZONTAL'] = 'horizontal';
})(MenuOrientation || (MenuOrientation = {}));

export let MenuCardStyle;

(function (MenuCardStyle) {
  MenuCardStyle['NONE'] = 'none';
  MenuCardStyle['CHEVRON'] = 'chevron';
  MenuCardStyle['JIGSAW'] = 'jigsaw';
  MenuCardStyle['ROUNDED'] = 'rounded';
  MenuCardStyle['PARALLELOGRAM'] = 'parallelogram';
  MenuCardStyle['CIRCLE'] = 'circle';
  MenuCardStyle['SQUARE'] = 'square';
  MenuCardStyle['BUBBLE'] = 'bubble';
  MenuCardStyle['TICKET'] = 'ticket';
  MenuCardStyle['LEAF'] = 'leaf';
})(MenuCardStyle || (MenuCardStyle = {}));

export let ThemeMode;

(function (ThemeMode) {
  ThemeMode['LIGHT'] = 'light';
  ThemeMode['DARK'] = 'dark';
  ThemeMode['SYSTEM'] = 'system';
})(ThemeMode || (ThemeMode = {}));

export let ThemeDirection;

(function (ThemeDirection) {
  ThemeDirection['LTR'] = 'ltr';
  ThemeDirection['RTL'] = 'rtl';
})(ThemeDirection || (ThemeDirection = {}));

export let AuthProvider;

(function (AuthProvider) {
  AuthProvider['JWT'] = 'jwt';
  AuthProvider['FIREBASE'] = 'firebase';
  AuthProvider['AUTH0'] = 'auth0';
  AuthProvider['AWS'] = 'aws';
  AuthProvider['SUPABASE'] = 'supabase';
})(AuthProvider || (AuthProvider = {}));

export let DashboardLayout;

(function (DashboardLayout) {
  DashboardLayout['GLASS'] = 'glass';
  DashboardLayout['CLASSIC'] = 'classic';
})(DashboardLayout || (DashboardLayout = {}));

export let DropzopType;

(function (DropzopType) {
  DropzopType['default'] = 'DEFAULT';
  DropzopType['standard'] = 'STANDARD';
})(DropzopType || (DropzopType = {}));

export let NotificationRingtone;

(function (NotificationRingtone) {
  NotificationRingtone['CHIME'] = 'chime';
  NotificationRingtone['DING'] = 'ding';
  NotificationRingtone['POP'] = 'pop';
  NotificationRingtone['BELL'] = 'bell';
  NotificationRingtone['MARIMBA'] = 'marimba';
  NotificationRingtone['WHISTLE'] = 'whistle';
  NotificationRingtone['HARP'] = 'harp';
  NotificationRingtone['CRYSTAL'] = 'crystal';
  NotificationRingtone['FLUTE'] = 'flute';
  NotificationRingtone['GENTLE'] = 'gentle';
})(NotificationRingtone || (NotificationRingtone = {}));

export const RibbonLayout = {
  QUANTUM: 'quantum',
  SPEED_DIAL: 'Premium',
  CLASSIC: 'classic',
  OUTLOOK: 'outlook'
};

export const HeaderTheme = {
  // ── 1. Solid Colors (4)
  DEFAULT: 'default',
  CHAMPAGNE_PEARL: 'champagne_pearl',
  EMERALD_MINT: 'emerald_mint',
  ROYAL_OBSIDIAN: 'royal_obsidian',

  // ── 2. Images & Horizons (4: 3 Light, 1 Dark)
  IMG_LEAF: 'img_leaf',
  IMG_SKYGLASS: 'img_skyglass',
  IMG_DUNES: 'img_dunes',
  IMG_TOKYO: 'img_tokyo',

  // ── 3. Shapes & Geometry (4)
  SHP_BAUHAUS: 'shp_bauhaus',
  SHP_PRISM: 'shp_prism',
  SHP_SPECTRUM: 'shp_spectrum',
  SHP_ISO_LIGHT: 'shp_iso_light',

  // ── 4. Textures & Abstract (4)
  TEX_CARRARA_MARBLE: 'tex_carrara_marble',
  TEX_HOLO_GRID: 'tex_holo_grid',
  TEX_OPAL_MATRIX: 'tex_opal_matrix',
  TEX_PASTEL_CLOUDS: 'tex_pastel_clouds',

  // ── 5. Gradients (4: 2 Light, 2 Dark)
  GRAD_SUNSET_ROSE: 'grad_sunset_rose',
  GRAD_CYAN_FROST: 'grad_cyan_frost',
  GRAD_COSMIC_NEBULA: 'grad_cosmic_nebula',
  GRAD_SOLAR_EMBER: 'grad_solar_ember'
};

export const APP_AUTH = AuthProvider.JWT;
export const DEFAULT_THEME_MODE = ThemeMode.SYSTEM;

const config = {
  headerTheme: HeaderTheme.DEFAULT,
  menuOrientation: MenuOrientation.VERTICAL,
  ribbonLayout: RibbonLayout.CLASSIC,
  menuCardStyle: MenuCardStyle.NONE,
  miniDrawer: false,
  fontFamily: `'Roboto', sans-serif`,
  fontSize: 14,
  isBold: false,
  isItalic: false,
  borderRadius: 8,
  outlinedFilled: true,
  presetColor: 'default',
  i18n: 'en',
  themeDirection: ThemeDirection.LTR,
  container: false,
  dashboardLayout: 'glass',
  dndMode: false,
  allowNotifications: true,
  notificationRingtone: NotificationRingtone.CHIME,
  notificationMapping: {
    newTask: 'nova_ping',
    taskCompleted: 'crystal_tap',
    approvalRequired: 'approval_bell',
    taskRejected: 'warning_echo',
    deadlineReminder: 'priority_pulse',
    overdueTask: 'critical_pulse',
    successMessage: 'digital_bloom',
    generalNotification: 'soft_spark',
    errorNotification: 'rapid_alert',
    meetingReminder: 'orbit_echo'
  }
};

export default config;
