import type { Dict } from '../../i18n'

/**
 * The first group every install gets. Its name is fixed, not localised: the
 * seeded row is the one wired to the shared watchlist, so it keeps the same
 * identity in storage regardless of the language the app is opened in.
 */
export const SEED_GROUP_NAME = '默认'

type Strings = {
  title: string
  subtitle: string
  groups: string
  uniqueSymbols: string
  newGroup: string
  groupName: string
  groupNamePlaceholder: string
  nameLimit: string
  create: string
  cancel: string
  save: string
  rename: string
  delete: string
  confirmDelete: string
  addSymbol: string
  add: string
  emptyGroups: string
  emptyGroup: string
  removeFromGroup: string
  move: string
  moveTo: string
  addToWatch: string
  removeFromWatch: string
}

export const strings = {
  zh: {
    title: '自选分组',
    subtitle: '按主题整理自选；默认分组与主自选保持同步',
    groups: '分组',
    uniqueSymbols: '去重标的',
    newGroup: '新增分组',
    groupName: '分组名称',
    groupNamePlaceholder: '例如：长线持有',
    nameLimit: '最多 24 个字符',
    create: '创建',
    cancel: '取消',
    save: '保存',
    rename: '重命名',
    delete: '删除',
    confirmDelete: '确认删除',
    addSymbol: '添加标的',
    add: '添加',
    emptyGroups: '还没有分组。新建一个，把想跟的标的归到一起。',
    emptyGroup: '这个分组还没有标的，用上面的选择器添加。',
    removeFromGroup: '移出分组',
    move: '移动',
    moveTo: '移动到',
    addToWatch: '加入主自选',
    removeFromWatch: '移出主自选',
  },
  en: {
    title: 'Watchlists',
    subtitle: 'Group what you follow. The default group stays in step with your main list',
    groups: 'Groups',
    uniqueSymbols: 'Unique symbols',
    newGroup: 'New group',
    groupName: 'Group name',
    groupNamePlaceholder: 'e.g. Long-term holds',
    nameLimit: 'Up to 24 characters',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    rename: 'Rename',
    delete: 'Delete',
    confirmDelete: 'Delete now',
    addSymbol: 'Add symbol',
    add: 'Add',
    emptyGroups: 'No groups yet, create one and gather the symbols you follow.',
    emptyGroup: 'No symbols in this group yet. Add one with the picker above.',
    removeFromGroup: 'Remove from group',
    move: 'Move',
    moveTo: 'Move to',
    addToWatch: 'Add to main watchlist',
    removeFromWatch: 'Remove from main watchlist',
  },
  ar: {
    title: 'قوائم المتابعة',
    subtitle: 'نظّم ما تتابعه, المجموعة الافتراضية تبقى متزامنة مع قائمتك الرئيسية',
    groups: 'المجموعات',
    uniqueSymbols: 'رموز فريدة',
    newGroup: 'مجموعة جديدة',
    groupName: 'اسم المجموعة',
    groupNamePlaceholder: 'مثال: استثمار طويل الأجل',
    nameLimit: 'حتى 24 حرفًا',
    create: 'إنشاء',
    cancel: 'إلغاء',
    save: 'حفظ',
    rename: 'إعادة تسمية',
    delete: 'حذف',
    confirmDelete: 'تأكيد الحذف',
    addSymbol: 'إضافة سهم',
    add: 'إضافة',
    emptyGroups: 'لا توجد مجموعات بعد, أنشئ مجموعة واجمع فيها الأسهم التي تتابعها.',
    emptyGroup: 'لا توجد أسهم في هذه المجموعة بعد. أضف سهمًا من الأعلى.',
    removeFromGroup: 'إزالة من المجموعة',
    move: 'نقل',
    moveTo: 'نقل إلى',
    addToWatch: 'إضافة إلى قائمة المتابعة',
    removeFromWatch: 'إزالة من قائمة المتابعة',
  },
} satisfies Dict<Strings>
