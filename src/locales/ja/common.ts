const common = {
  appTitle: 'ResumeTune', appSubtitle: 'AIで求人マッチング、カバーレター、履歴書最適化', yourCV: '履歴書', addYourCV: '履歴書の内容を追加', checkJobMatch: '適合度を確認', analyzingMatch: '分析中...', aiAdvisor: 'AIキャリアアドバイザー', disclaimerTitle: '重要なお知らせ', howTo: '使い方：',
  langEN: 'EN', langTR: 'TR', langES: 'ES', langDE: 'DE', langZH: 'ZH', langKO: 'KO', langJA: 'JA', langAR: 'AR',
  chat: { title: 'AI採用担当とチャット', quickActions: 'クイックアクション：', qaCover: 'カバーレターを作成', qaResume: '履歴書を最適化', qaReqs: '主な要件', qaSkills: 'スキル適合', emptyTitle: '求人分析やカバーレター作成をお手伝いします！', emptySubtitle: '上のクイックアクションを試すか、質問してください', exportPDF: 'PDF', exportDOCX: 'DOCX', inputPlaceholderReady: '職務、適合度、アドバイスについて質問…', inputPlaceholderDisabled: 'まずプロフィール、連絡先、履歴書、求人情報を追加してください…' },
  fileUpload: { pasteText: 'テキストを貼り付け', uploadFile: 'ファイルをアップロード', recommendedTitle: '✨ 推奨：最良の結果には履歴書テキストを貼り付け', bulletAccuracy: 'より正確：職歴の順序を保持', bulletFaster: 'より高速：ファイル解析不要', bulletEditing: '簡単編集：いつでも迅速に変更', bulletNoLimits: '制限なし：あらゆる長さの履歴書に対応', howToCopyTitle: '💡 コピー方法：', howToCopyBody: 'Word/PDFで履歴書を開く → すべて選択 (Ctrl+A) → コピー (Ctrl+C) → ここに貼り付け', contentReady: '✓ 履歴書の内容が準備完了', edit: '履歴書の内容を編集', delete: '履歴書の内容を削除', goodLength: '適切な長さ', needMore: '内容を増やしてください', needMoreBtn: '内容を増やしてください', useThisCv: 'この履歴書を使用 ✓', altTitle: '📁 ファイルアップロード（代替）', bulletSupport: 'PDF/Word対応：既存の履歴書をアップロード', bulletExtraction: '自動抽出：テキストを抽出します', bulletBackup: 'バックアップ：コピー不可のとき使用', note: '⚠️ 注意：', noteText: 'テキスト抽出は書式や順序を変更する場合があります。「テキストを貼り付け」を推奨。', processing: '処理中…', dropHere: 'ここにドロップ…', uploadCv: '履歴書をアップロード', dragDropHint: 'ここにドラッグ＆ドロップ、またはクリックして選択', onlyPdfWord: 'PDFまたはWordのみ', errorSave: '履歴書の保存に失敗しました。ブラウザ設定を確認してください。', errorRequired: '履歴書の内容を入力してください', errorMin: 'さらに内容を入力してください（最低50文字）', pastedLabel: '貼り付けた履歴書の内容' },
  jobDesc: { label: '求人情報', placeholder: 'ここに求人情報を貼り付け…', chars: '文字' },
  profile: { label: 'プロフィール', addPrompt: 'プロフィール情報を追加', save: 'プロフィールを保存', cancel: 'キャンセル', errorRequired: 'プロフィール情報を入力してください', errorMin: 'さらに詳細を入力してください（最低50文字）', placeholder: '自己紹介を入力…', previewHelpTitle: 'プロフィール情報を追加', previewHelpDesc: '背景、経験、希望を教えてください' },
  contact: { label: '連絡先情報', fullName: '氏名', email: 'メール', phone: '電話番号', location: '現在地', title: '職位', linkedin: 'LinkedInプロフィール', portfolio: 'ポートフォリオサイト', optional: '（任意）', save: '連絡先を保存', clearTitle: '連絡先をクリア', editTitle: '連絡先を編集', errors: { fullName: '氏名は2文字以上で必須です', emailRequired: 'メールは必須です', emailInvalid: '有効なメールアドレスを入力してください', location: '現在地は必須です', professionalTitle: '職位は必須です', linkedin: 'LinkedIn URLに「linkedin.com」を含めてください', portfolio: 'ポートフォリオは「http://」または「https://」で始めてください', fixFollowing: '次を修正してください：' }, requiredFields: '* 必須項目' },
  match: { title: '適合分析', found: '適合あり！', notFound: '適合なし', analyzedAt: '分析時刻' },
  errors: {
    networkError: 'ネットワークエラー。接続を確認して再試行してください。',
    timeout: 'タイムアウトしました。再試行してください。',
    invalidInput: '無効な入力です。内容を確認してください。',
    exportFailed: 'エクスポートに失敗しました。再試行してください。',
    aiFailed: 'AI リクエストに失敗しました。再試行してください。',
    unknown: '問題が発生しました。再試行してください。'
  },
  source: { pasted: 'ソース：貼り付けた履歴書の内容' },
  disclaimer: {
    aiGeneratedTitle: '🤖 AI 生成コンテンツ',
    aiGeneratedBody: 'すべての出力（適合判定、カバーレター、履歴書最適化）は AI により生成され、誤りや不正確、不適切な提案を含む可能性があります。',
    responsibilityTitle: '✅ ご自身の責任',
    responsibilityBody: '応募に使用する前に、AI 生成コンテンツを必ず精査・編集・確認してください。個人情報、日付、企業名、実績の正確性を確認しましょう。',
    privacyTitle: '🔒 データプライバシー',
    privacyBody: '履歴書および個人情報はローカルで処理され、分析のため Google Gemini に送信されます。AI サービスで処理したくない機微情報は含めないでください。',
    liabilityTitle: '⚖️ 免責事項',
    liabilityBody: '応募成功は保証されず、AI 生成コンテンツの使用による結果について当方は責任を負いません。本ツールは最終解ではなく出発点としてご利用ください。'
  },
  howToDetailed: {
    stepsTitle: '使い方：',
    step1: 'プロフィール情報（経歴、経験、希望）を追加。',
    step2: '連絡先情報（氏名、メール、所在地等）を追加。',
    step3: '履歴書テキストを直接貼り付け（推奨）または PDF/Word をアップロード。',
    step4: '求人情報をテキストエリアに貼り付け。',
    step5: '「適合度を確認」をクリックし、パーソナライズされた可否の提案を取得。',
    step6: 'チャットで職務や適合度に関する詳細を質問。',
    bestPracticeTitle: '💡 ベストプラクティス：',
    bestPracticeBody: 'Word/PDF で履歴書を開く → 全選択 (Ctrl+A) → コピー (Ctrl+C) → テキストエリアに貼り付け。書式保持、職歴順序維持、高品質な分析につながります。',
    whyTextTitle: '✨ テキスト入力が優れる理由：',
    whyTextBullet1: '• 完全な精度：解析エラーなし',
    whyTextBullet2: '• 高速処理：即時分析',
    whyTextBullet3: '• 容易な編集：迅速な改善',
    whyTextBullet4: '• より良い結果：高品質な出力'
  }
};

export default common;


