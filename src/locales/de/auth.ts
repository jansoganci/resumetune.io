const auth = {
  // Login Page
  login: {
    title: 'Melde dich bei deinem Konto an',
    orText: 'Oder',
    createAccount: 'ein neues Konto erstellen',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'Gib deine E-Mail ein',
    password: 'Passwort',
    passwordPlaceholder: 'Gib dein Passwort ein',
    usePasswordInstead: 'Stattdessen Passwort verwenden',
    useMagicLink: 'Magic-Link verwenden',
    forgotPassword: 'Passwort vergessen?',
    sendMagicLink: 'Magic-Link senden',
    signIn: 'Anmelden',
    backToHome: '← Zurück zur Startseite',
    magicLinkSent: 'Überprüfe deine E-Mail für den Magic-Link!',
    loginSuccess: 'Erfolgreich angemeldet!',
    loginFailed: 'Anmeldung fehlgeschlagen'
  },

  // Register Page
  register: {
    title: 'Erstelle dein Konto',
    orText: 'Oder',
    signInExisting: 'bei bestehendem Konto anmelden',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'Gib deine E-Mail ein',
    password: 'Passwort',
    passwordPlaceholder: 'Wähle ein Passwort',
    passwordRequirement: 'Muss mindestens 6 Zeichen lang sein',
    confirmPassword: 'Passwort bestätigen',
    confirmPasswordPlaceholder: 'Bestätige dein Passwort',
    createAccount: 'Konto erstellen',
    agreeToTerms: 'Mit der Erstellung eines Kontos stimmst du unseren',
    termsOfService: 'Nutzungsbedingungen',
    and: 'und',
    privacyPolicy: 'Datenschutzrichtlinie',
    backToHome: '← Zurück zur Startseite',
    passwordMismatch: 'Passwörter stimmen nicht überein',
    passwordTooShort: 'Passwort muss mindestens 6 Zeichen lang sein',
    registerSuccess: 'Konto erfolgreich erstellt!',
    registerFailed: 'Registrierung fehlgeschlagen'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: 'Überprüfe deine E-Mail',
    checkEmailMessage: 'Wir haben einen Link zum Zurücksetzen des Passworts gesendet an',
    checkEmailInstructions: 'Klicke auf den Link in der E-Mail, um dein Passwort zurückzusetzen. Der Link läuft in 24 Stunden ab.',
    didntReceive: 'E-Mail nicht erhalten? Erneut versuchen',
    backToSignIn: 'Zurück zur Anmeldung',
    resetTitle: 'Setze dein Passwort zurück',
    resetInstructions: 'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'Gib deine E-Mail ein',
    sendResetLink: 'Zurücksetzungslink senden',
    resetEmailSent: 'E-Mail zum Zurücksetzen des Passworts gesendet! Überprüfe deinen Posteingang.',
    resetFailed: 'Fehler beim Senden der Zurücksetzungs-E-Mail'
  }
};

export default auth;
