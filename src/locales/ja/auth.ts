const auth = {
  // Login Page
  login: {
    title: 'アカウントにサインイン',
    orText: 'または',
    createAccount: '新しいアカウントを作成',
    email: 'メールアドレス',
    emailPlaceholder: 'メールアドレスを入力',
    password: 'パスワード',
    passwordPlaceholder: 'パスワードを入力',
    usePasswordInstead: '代わりにパスワードを使用',
    useMagicLink: 'マジックリンクを使用',
    forgotPassword: 'パスワードをお忘れですか？',
    sendMagicLink: 'マジックリンクを送信',
    signIn: 'サインイン',
    backToHome: '← ホームに戻る',
    magicLinkSent: 'マジックリンクをメールで確認してください！',
    loginSuccess: 'ログインに成功しました！',
    loginFailed: 'ログインに失敗しました'
  },

  // Register Page
  register: {
    title: 'アカウントを作成',
    orText: 'または',
    signInExisting: '既存のアカウントにサインイン',
    email: 'メールアドレス',
    emailPlaceholder: 'メールアドレスを入力',
    password: 'パスワード',
    passwordPlaceholder: 'パスワードを選択',
    passwordRequirement: '6文字以上である必要があります',
    confirmPassword: 'パスワードの確認',
    confirmPasswordPlaceholder: 'パスワードを確認',
    createAccount: 'アカウントを作成',
    agreeToTerms: 'アカウントを作成することにより、次に同意したことになります',
    termsOfService: '利用規約',
    and: 'および',
    privacyPolicy: 'プライバシーポリシー',
    backToHome: '← ホームに戻る',
    passwordMismatch: 'パスワードが一致しません',
    passwordTooShort: 'パスワードは6文字以上である必要があります',
    registerSuccess: 'アカウントが正常に作成されました！',
    registerFailed: '登録に失敗しました'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: 'メールを確認してください',
    checkEmailMessage: 'パスワードリセットリンクを次のアドレスに送信しました',
    checkEmailInstructions: 'メール内のリンクをクリックしてパスワードをリセットしてください。リンクは24時間後に期限切れになります。',
    didntReceive: 'メールが届きませんでしたか？もう一度お試しください',
    backToSignIn: 'サインインに戻る',
    resetTitle: 'パスワードをリセット',
    resetInstructions: 'メールアドレスを入力すると、パスワードをリセットするためのリンクをお送りします',
    email: 'メールアドレス',
    emailPlaceholder: 'メールアドレスを入力',
    sendResetLink: 'リセットリンクを送信',
    resetEmailSent: 'パスワードリセットメールを送信しました！受信トレイを確認してください。',
    resetFailed: 'リセットメールの送信に失敗しました'
  }
};

export default auth;
