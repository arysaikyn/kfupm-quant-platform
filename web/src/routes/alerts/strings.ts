import type { Dict } from '../../i18n'

type Strings = {
  title: string
  subtitle: string
  triggered: string
  waiting: string
  formTitle: string
  editTitle: string
  editHint: string
  symbol: string
  direction: string
  above: string
  below: string
  threshold: string
  current: string
  create: string
  save: string
  cancel: string
  listTitle: string
  empty: string
  delete: string
  edit: string
  confirmDelete: string
  errPrice: string
  errAbove: string
  errBelow: string
}

export const strings = {
  zh: {
    title: '价格提醒',
    subtitle: '价格触达条件即标记，不用盯盘',
    triggered: '已触发',
    waiting: '监控中',
    formTitle: '新建提醒',
    editTitle: '编辑提醒',
    editHint: '标的固定，只改方向和触发价。',
    symbol: '标的',
    direction: '方向',
    above: '高于',
    below: '低于',
    threshold: '触发价',
    current: '现价',
    create: '添加提醒',
    save: '保存修改',
    cancel: '取消',
    listTitle: '提醒列表',
    empty: '还没有提醒，用上面的表单添加第一条。',
    delete: '删除',
    edit: '编辑',
    confirmDelete: '确认删除',
    errPrice: '请输入大于 0 的价格',
    errAbove: '高于方向需要比现价更高',
    errBelow: '低于方向需要比现价更低',
  },
  en: {
    title: 'Price alerts',
    subtitle: 'Marked the moment the price gets there',
    triggered: 'Triggered',
    waiting: 'Active',
    formTitle: 'New alert',
    editTitle: 'Edit alert',
    editHint: 'The symbol stays fixed, only the direction and trigger price change.',
    symbol: 'Symbol',
    direction: 'Direction',
    above: 'Above',
    below: 'Below',
    threshold: 'Trigger price',
    current: 'Now',
    create: 'Add alert',
    save: 'Save changes',
    cancel: 'Cancel',
    listTitle: 'Your alerts',
    empty: 'No alerts yet, add your first one with the form above.',
    delete: 'Delete',
    edit: 'Edit',
    confirmDelete: 'Delete now',
    errPrice: 'Enter a price above zero',
    errAbove: 'Above needs a price higher than the current one',
    errBelow: 'Below needs a price lower than the current one',
  },
  ar: {
    title: 'تنبيهات الأسعار',
    subtitle: 'يُعلَّم التنبيه فور وصول السعر إلى شرطه',
    triggered: 'تم التنبيه',
    waiting: 'نشط',
    formTitle: 'تنبيه جديد',
    editTitle: 'تعديل التنبيه',
    editHint: 'يبقى السهم ثابتًا، يتغير الاتجاه وسعر التنبيه فقط.',
    symbol: 'السهم',
    direction: 'الاتجاه',
    above: 'أعلى من',
    below: 'أدنى من',
    threshold: 'سعر التنبيه',
    current: 'السعر الحالي',
    create: 'إضافة تنبيه',
    save: 'حفظ التعديل',
    cancel: 'إلغاء',
    listTitle: 'تنبيهاتك',
    empty: 'لا توجد تنبيهات بعد، أضف أول تنبيه من النموذج أعلاه.',
    delete: 'حذف',
    edit: 'تعديل',
    confirmDelete: 'تأكيد الحذف',
    errPrice: 'أدخل سعرًا أكبر من صفر',
    errAbove: 'يجب أن يكون السعر أعلى من السعر الحالي',
    errBelow: 'يجب أن يكون السعر أدنى من السعر الحالي',
  },
} satisfies Dict<Strings>
