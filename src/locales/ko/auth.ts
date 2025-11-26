const auth = {
  // Login Page
  login: {
    title: '계정에 로그인',
    orText: '또는',
    createAccount: '새 계정 만들기',
    email: '이메일 주소',
    emailPlaceholder: '이메일을 입력하세요',
    password: '비밀번호',
    passwordPlaceholder: '비밀번호를 입력하세요',
    usePasswordInstead: '대신 비밀번호 사용',
    useMagicLink: '매직 링크 사용',
    forgotPassword: '비밀번호를 잊으셨나요?',
    sendMagicLink: '매직 링크 보내기',
    signIn: '로그인',
    backToHome: '← 홈으로 돌아가기',
    magicLinkSent: '이메일에서 매직 링크를 확인하세요!',
    loginSuccess: '로그인 성공!',
    loginFailed: '로그인 실패'
  },

  // Register Page
  register: {
    title: '계정 만들기',
    orText: '또는',
    signInExisting: '기존 계정으로 로그인',
    email: '이메일 주소',
    emailPlaceholder: '이메일을 입력하세요',
    password: '비밀번호',
    passwordPlaceholder: '비밀번호를 선택하세요',
    passwordRequirement: '최소 6자 이상이어야 합니다',
    confirmPassword: '비밀번호 확인',
    confirmPasswordPlaceholder: '비밀번호를 확인하세요',
    createAccount: '계정 만들기',
    agreeToTerms: '계정을 만들면 다음에 동의하는 것입니다',
    termsOfService: '서비스 약관',
    and: '및',
    privacyPolicy: '개인정보 보호정책',
    backToHome: '← 홈으로 돌아가기',
    passwordMismatch: '비밀번호가 일치하지 않습니다',
    passwordTooShort: '비밀번호는 최소 6자 이상이어야 합니다',
    registerSuccess: '계정이 성공적으로 생성되었습니다!',
    registerFailed: '등록 실패'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: '이메일을 확인하세요',
    checkEmailMessage: '비밀번호 재설정 링크를 다음 주소로 보냈습니다',
    checkEmailInstructions: '이메일의 링크를 클릭하여 비밀번호를 재설정하세요. 링크는 24시간 후에 만료됩니다.',
    didntReceive: '이메일을 받지 못하셨나요? 다시 시도',
    backToSignIn: '로그인으로 돌아가기',
    resetTitle: '비밀번호 재설정',
    resetInstructions: '이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다',
    email: '이메일 주소',
    emailPlaceholder: '이메일을 입력하세요',
    sendResetLink: '재설정 링크 보내기',
    resetEmailSent: '비밀번호 재설정 이메일이 전송되었습니다! 받은 편지함을 확인하세요.',
    resetFailed: '재설정 이메일 전송 실패'
  }
};

export default auth;
