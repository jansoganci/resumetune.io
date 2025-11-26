const auth = {
  // Login Page
  login: {
    title: 'Hesabınıza giriş yapın',
    orText: 'Veya',
    createAccount: 'yeni hesap oluştur',
    email: 'E-posta adresi',
    emailPlaceholder: 'E-postanızı girin',
    password: 'Şifre',
    passwordPlaceholder: 'Şifrenizi girin',
    usePasswordInstead: 'Bunun yerine şifre kullan',
    useMagicLink: 'Sihirli bağlantı kullan',
    forgotPassword: 'Şifrenizi mi unuttunuz?',
    sendMagicLink: 'Sihirli bağlantı gönder',
    signIn: 'Giriş yap',
    backToHome: '← Ana sayfaya dön',
    magicLinkSent: 'Sihirli bağlantı için e-postanızı kontrol edin!',
    loginSuccess: 'Başarıyla giriş yapıldı!',
    loginFailed: 'Giriş başarısız'
  },

  // Register Page
  register: {
    title: 'Hesabınızı oluşturun',
    orText: 'Veya',
    signInExisting: 'mevcut hesaba giriş yap',
    email: 'E-posta adresi',
    emailPlaceholder: 'E-postanızı girin',
    password: 'Şifre',
    passwordPlaceholder: 'Bir şifre seçin',
    passwordRequirement: 'En az 6 karakter olmalı',
    confirmPassword: 'Şifreyi onayla',
    confirmPasswordPlaceholder: 'Şifrenizi onaylayın',
    createAccount: 'Hesap oluştur',
    agreeToTerms: 'Bir hesap oluşturarak',
    termsOfService: 'Hizmet Şartlarımızı',
    and: 've',
    privacyPolicy: 'Gizlilik Politikamızı',
    backToHome: '← Ana sayfaya dön',
    passwordMismatch: 'Şifreler eşleşmiyor',
    passwordTooShort: 'Şifre en az 6 karakter olmalı',
    registerSuccess: 'Hesap başarıyla oluşturuldu!',
    registerFailed: 'Kayıt başarısız'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: 'E-postanızı kontrol edin',
    checkEmailMessage: 'Şifre sıfırlama bağlantısını gönderdik',
    checkEmailInstructions: 'Şifrenizi sıfırlamak için e-postadaki bağlantıya tıklayın. Bağlantı 24 saat içinde sona erecek.',
    didntReceive: 'E-postayı almadınız mı? Tekrar deneyin',
    backToSignIn: 'Giriş sayfasına dön',
    resetTitle: 'Şifrenizi sıfırlayın',
    resetInstructions: 'E-posta adresinizi girin ve size şifrenizi sıfırlamak için bir bağlantı gönderelim',
    email: 'E-posta adresi',
    emailPlaceholder: 'E-postanızı girin',
    sendResetLink: 'Sıfırlama bağlantısı gönder',
    resetEmailSent: 'Şifre sıfırlama e-postası gönderildi! Gelen kutunuzu kontrol edin.',
    resetFailed: 'Sıfırlama e-postası gönderilemedi'
  }
};

export default auth;
