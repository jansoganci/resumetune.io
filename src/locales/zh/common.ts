const common = {
  appTitle: 'ResumeTune',
  appSubtitle: 'AI 帮你匹配职位、生成求职信并优化简历',
  yourCV: '你的简历', addYourCV: '添加简历内容', checkJobMatch: '检查匹配度', analyzingMatch: '正在分析…', aiAdvisor: 'AI 职业顾问', disclaimerTitle: '重要提示', howTo: '使用方法：',
  langEN: 'EN', langTR: 'TR', langES: 'ES', langDE: 'DE', langZH: 'ZH', langKO: 'KO', langJA: 'JA', langAR: 'AR',
  chat: { title: '与 AI 招聘官聊天', quickActions: '快速操作：', qaCover: '生成求职信', qaResume: '优化简历', qaReqs: '关键要求', qaSkills: '技能匹配', emptyTitle: '准备好帮助你分析职位和撰写求职信！', emptySubtitle: '试试上面的快速操作，或直接提问', exportPDF: 'PDF', exportDOCX: 'DOCX', inputPlaceholderReady: '询问职位、匹配度或寻求建议…', inputPlaceholderDisabled: '请先添加个人资料、联系方式、简历和职位描述…' },
  fileUpload: { pasteText: '粘贴文本', uploadFile: '上传文件', recommendedTitle: '✨ 推荐：粘贴简历文本效果更佳', bulletAccuracy: '更精准：保留工作经历顺序', bulletFaster: '更快速：无需解析文件', bulletEditing: '易编辑：随时快速修改', bulletNoLimits: '无限制：适用于任意长度简历', howToCopyTitle: '💡 如何复制：', howToCopyBody: '在 Word/PDF 打开简历 → 全选 (Ctrl+A) → 复制 (Ctrl+C) → 粘贴到此处', contentReady: '✓ 简历内容已就绪', edit: '编辑简历内容', delete: '删除简历内容', goodLength: '长度合适', needMore: '需要更多内容', needMoreBtn: '需要更多内容', useThisCv: '使用此简历 ✓', altTitle: '📁 文件上传（备选）', bulletSupport: '支持 PDF/Word：上传你的简历', bulletExtraction: '自动提取：我们替你提取文本', bulletBackup: '备选方案：无法复制时使用', note: '⚠️ 注意：', noteText: '文本提取可能改变格式或顺序。最佳实践：使用“粘贴文本”。', processing: '处理中…', dropHere: '拖放到此处…', uploadCv: '上传简历', dragDropHint: '拖拽文件到此或点击选择', onlyPdfWord: '仅限 PDF 或 Word 文档', errorSave: '无法保存简历文本。请检查浏览器存储设置。', errorRequired: '请输入简历内容', errorMin: '请提供更多简历内容（至少 50 个字符）', pastedLabel: '粘贴的简历内容' },
  jobDesc: { label: '职位描述', placeholder: '将职位描述粘贴到此处…', chars: '字符' },
  profile: { label: '个人资料', addPrompt: '添加你的个人资料信息', save: '保存资料', cancel: '取消', errorRequired: '请输入个人资料信息', errorMin: '请提供更多信息（至少 50 个字符）', placeholder: '介绍一下你自己…', previewHelpTitle: '添加你的个人资料信息', previewHelpDesc: '告诉我们你的背景、经验和偏好' },
  contact: { label: '联系方式', fullName: '姓名', email: '邮箱', phone: '电话', location: '当前位置', title: '职位头衔', linkedin: 'LinkedIn 主页', portfolio: '作品集网站', optional: '（可选）', save: '保存联系方式', clearTitle: '清除联系方式', editTitle: '编辑联系方式', errors: { fullName: '姓名必填且不少于 2 个字符', emailRequired: '邮箱必填', emailInvalid: '请输入有效邮箱地址', location: '当前位置必填', professionalTitle: '职位头衔必填', linkedin: 'LinkedIn 链接应包含 “linkedin.com”', portfolio: '作品集网址应以 “http://” 或 “https://” 开头', fixFollowing: '请修正以下问题：' }, requiredFields: '* 必填项' },
  match: { title: '匹配分析', found: '找到匹配！', notFound: '未匹配', analyzedAt: '分析时间' },
  errors: {
    networkError: '网络错误，请检查连接后重试。',
    timeout: '请求超时，请重试。',
    invalidInput: '输入无效，请检查后重试。',
    exportFailed: '导出失败，请重试。',
    aiFailed: 'AI 请求失败，请重试。',
    unknown: '发生错误，请重试。'
  },
  source: { pasted: '来源：粘贴的简历内容' },
  disclaimer: {
    aiGeneratedTitle: '🤖 AI 生成内容',
    aiGeneratedBody: '所有输出（职位匹配、求职信、简历优化）均由 AI 生成，可能包含错误、不准确或不当建议。',
    responsibilityTitle: '✅ 使用者责任',
    responsibilityBody: '在用于求职前，请仔细审阅、编辑并核对所有 AI 生成内容。务必确认个人信息、日期、公司名称与成就的准确性。',
    privacyTitle: '🔒 数据隐私',
    privacyBody: '你的简历和个人信息会在本地处理，并发送到 Google Gemini 进行分析。请勿包含不希望由 AI 服务处理的敏感信息。',
    liabilityTitle: '⚖️ 免责声明',
    liabilityBody: '我们不保证求职成功，亦不对使用 AI 生成内容的后果负责。此工具仅作为起点，而非最终成品。'
  },
  howToDetailed: {
    stepsTitle: '使用方法：',
    step1: '添加个人资料（背景、经验、偏好）。',
    step2: '添加联系信息（姓名、邮箱、位置等）。',
    step3: '直接粘贴简历文本（推荐）或上传 PDF/Word 文件。',
    step4: '将职位描述粘贴到文本区域。',
    step5: '点击“检查匹配度”获取个性化是/否建议。',
    step6: '使用聊天询问职位细节与个人匹配度。',
    bestPracticeTitle: '💡 最佳实践：',
    bestPracticeBody: '在 Word/PDF 打开简历 → 全选 (Ctrl+A) → 复制 (Ctrl+C) → 粘贴到文本框。此方法保留格式、确保工作经历顺序，并提升匹配与优化质量。',
    whyTextTitle: '✨ 文本输入更好的原因：',
    whyTextBullet1: '• 精确度高：无解析错误',
    whyTextBullet2: '• 处理更快：即时分析',
    whyTextBullet3: '• 易于编辑：快速优化',
    whyTextBullet4: '• 效果更佳：更高质量输出'
  }
};

export default common;


