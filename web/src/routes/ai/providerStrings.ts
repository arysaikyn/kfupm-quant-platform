import type { Dict } from '../../i18n'

export type ProviderStrings = {
  title: string
  lead: string
  demoMode: string
  liveMode: string
  baseUrl: string
  baseHint: string
  model: string
  modelHint: string
  apiKey: string
  keyHint: string
  keepKey: string
  save: string
  saving: string
  saved: string
  useDemo: string
  demoNote: string
  error: string
  invalidUrl: string
  requiredModel: string
  requiredKey: string
  privacy: string
}

export const strings: Dict<ProviderStrings> = {
  en: {
    title: 'AI provider',
    lead: 'Demo mode is on by default. Add any OpenAI-compatible endpoint to use a real model.',
    demoMode: 'Demo · pre-recorded',
    liveMode: 'Live provider',
    baseUrl: 'Base URL',
    baseHint: 'OpenAI-compatible, for example https://api.openai.com/v1',
    model: 'Model',
    modelHint: 'The model ID your provider exposes.',
    apiKey: 'API key',
    keyHint: 'Stored on the local backend. Leave blank to keep the current key.',
    keepKey: 'Leave blank to keep the current key',
    save: 'Save and go live',
    saving: 'Saving…',
    saved: 'Saved. Live mode is on.',
    useDemo: 'Use demo mode',
    demoNote: 'Demo mode never contacts a provider or spends a key.',
    error: 'Could not configure the provider. Check that the live backend is running.',
    invalidUrl: 'Enter an http(s) base URL.',
    requiredModel: 'Enter a model ID.',
    requiredKey: 'Enter your API key to leave demo mode.',
    privacy: 'Use a test key. Requests go to the provider you enter; this app does not ship a developer key.',
  },
  zh: {
    title: 'AI 提供方',
    lead: '默认是演示模式。填入任意 OpenAI 兼容接口，即可使用真实模型。',
    demoMode: '演示 · 预录回复',
    liveMode: '已连接提供方',
    baseUrl: '接口地址',
    baseHint: 'OpenAI 兼容，例如 https://api.openai.com/v1',
    model: '模型',
    modelHint: '提供方支持的模型 ID。',
    apiKey: 'API 密钥',
    keyHint: '保存在本地后端；留空则沿用当前密钥。',
    keepKey: '留空沿用当前密钥',
    save: '保存并切换为真实模型',
    saving: '正在保存…',
    saved: '已保存，真实模型已启用。',
    useDemo: '切回演示模式',
    demoNote: '演示模式不会请求任何提供方，也不会消耗密钥。',
    error: '配置失败。请确认本地实时后端已经启动。',
    invalidUrl: '请输入 http(s) 开头的接口地址。',
    requiredModel: '请输入模型 ID。',
    requiredKey: '离开演示模式需要填写你的 API 密钥。',
    privacy: '请使用测试密钥。请求会发送到你填写的提供方；这个应用不附带开发者密钥。',
  },
  ar: {
    title: 'مزوّد الذكاء الاصطناعي',
    lead: 'وضع العرض مفعّل افتراضيًا. أضف أي واجهة متوافقة مع OpenAI لاستخدام نموذج حقيقي.',
    demoMode: 'عرض · ردود مسجلة',
    liveMode: 'مزوّد مباشر',
    baseUrl: 'عنوان الواجهة',
    baseHint: 'متوافق مع OpenAI، مثل https://api.openai.com/v1',
    model: 'النموذج',
    modelHint: 'معرّف النموذج لدى المزوّد.',
    apiKey: 'مفتاح API',
    keyHint: 'يُحفظ في الخادم المحلي. اتركه فارغًا للإبقاء على المفتاح الحالي.',
    keepKey: 'اتركه فارغًا للإبقاء على المفتاح الحالي',
    save: 'احفظ وانتقل إلى المباشر',
    saving: 'جارٍ الحفظ…',
    saved: 'تم الحفظ. الوضع المباشر مفعّل.',
    useDemo: 'استخدم وضع العرض',
    demoNote: 'وضع العرض لا يتصل بأي مزوّد ولا يستهلك مفتاحًا.',
    error: 'تعذر إعداد المزوّد. تأكد من تشغيل الخادم المباشر.',
    invalidUrl: 'أدخل عنوان واجهة يبدأ بـ http(s).',
    requiredModel: 'أدخل معرّف النموذج.',
    requiredKey: 'أدخل مفتاح API للخروج من وضع العرض.',
    privacy: 'استخدم مفتاح اختبار. تذهب الطلبات إلى المزوّد الذي تدخله؛ هذا التطبيق لا يتضمن مفتاح مطوّر.',
  },
}
