import type { Dict } from '../../i18n'

type Strings = {
  title: string
  subtitle: string
  triggered: string
  waiting: string
  formTitle: string
  symbol: string
  direction: string
  above: string
  below: string
  threshold: string
  current: string
  create: string
  listTitle: string
  empty: string
  delete: string
  errPrice: string
  errAbove: string
  errBelow: string
}

export const strings = {
  zh: {
    title: '价格提醒',
    subtitle: '价格触达条件即标记，不用盯盘',
    triggered: '已触发',
    waiting: '等待中',
    formTitle: '新建提醒',
    symbol: '标的',
    direction: '方向',
    above: '高于',
    below: '低于',
    threshold: '触发价',
    current: '现价',
    create: '添加提醒',
    listTitle: '提醒列表',
    empty: '还没有提醒，用上面的表单添加第一条。',
    delete: '删除',
    errPrice: '请输入大于 0 的价格',
    errAbove: '高于方向需要比现价更高',
    errBelow: '低于方向需要比现价更低',
  },
  en: {
    title: 'Price alerts',
    subtitle: 'Marked the moment the price gets there',
    triggered: 'Triggered',
    waiting: 'Waiting',
    formTitle: 'New alert',
    symbol: 'Symbol',
    direction: 'Direction',
    above: 'Above',
    below: 'Below',
    threshold: 'Trigger price',
    current: 'Now',
    create: 'Add alert',
    listTitle: 'Your alerts',
    empty: 'No alerts yet, add your first one with the form above.',
    delete: 'Delete',
    errPrice: 'Enter a price above zero',
    errAbove: 'Above needs a price higher than the current one',
    errBelow: 'Below needs a price lower than the current one',
  },
  ar: {
    title: 'تنبيهات الأسعار',
    subtitle: 'يُعلَّم التنبيه فور وصول السعر إلى شرطه',
    triggered: 'تم التنبيه',
    waiting: 'قيد الانتظار',
    formTitle: 'تنبيه جديد',
    symbol: 'السهم',
    direction: 'الاتجاه',
    above: 'أعلى من',
    below: 'أدنى من',
    threshold: 'سعر التنبيه',
    current: 'السعر الحالي',
    create: 'إضافة تنبيه',
    listTitle: 'تنبيهاتك',
    empty: 'لا توجد تنبيهات بعد, أضف أول تنبيه من النموذج أعلاه.',
    delete: 'حذف',
    errPrice: 'أدخل سعرًا أكبر من صفر',
    errAbove: 'يجب أن يكون السعر أعلى من السعر الحالي',
    errBelow: 'يجب أن يكون السعر أدنى من السعر الحالي',
  },
} satisfies Dict<Strings>
