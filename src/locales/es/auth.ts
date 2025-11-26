const auth = {
  // Login Page
  login: {
    title: 'Inicia sesión en tu cuenta',
    orText: 'O',
    createAccount: 'crear una nueva cuenta',
    email: 'Correo electrónico',
    emailPlaceholder: 'Ingresa tu correo',
    password: 'Contraseña',
    passwordPlaceholder: 'Ingresa tu contraseña',
    usePasswordInstead: 'Usar contraseña en su lugar',
    useMagicLink: 'Usar enlace mágico',
    forgotPassword: '¿Olvidaste tu contraseña?',
    sendMagicLink: 'Enviar enlace mágico',
    signIn: 'Iniciar sesión',
    backToHome: '← Volver al inicio',
    magicLinkSent: '¡Revisa tu correo para el enlace mágico!',
    loginSuccess: '¡Sesión iniciada correctamente!',
    loginFailed: 'Error al iniciar sesión'
  },

  // Register Page
  register: {
    title: 'Crea tu cuenta',
    orText: 'O',
    signInExisting: 'iniciar sesión en cuenta existente',
    email: 'Correo electrónico',
    emailPlaceholder: 'Ingresa tu correo',
    password: 'Contraseña',
    passwordPlaceholder: 'Elige una contraseña',
    passwordRequirement: 'Debe tener al menos 6 caracteres',
    confirmPassword: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Confirma tu contraseña',
    createAccount: 'Crear cuenta',
    agreeToTerms: 'Al crear una cuenta, aceptas nuestros',
    termsOfService: 'Términos de servicio',
    and: 'y',
    privacyPolicy: 'Política de privacidad',
    backToHome: '← Volver al inicio',
    passwordMismatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    registerSuccess: '¡Cuenta creada correctamente!',
    registerFailed: 'Error al registrar'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: 'Revisa tu correo',
    checkEmailMessage: 'Hemos enviado un enlace de restablecimiento de contraseña a',
    checkEmailInstructions: 'Haz clic en el enlace del correo para restablecer tu contraseña. El enlace expirará en 24 horas.',
    didntReceive: '¿No recibiste el correo? Inténtalo de nuevo',
    backToSignIn: 'Volver a iniciar sesión',
    resetTitle: 'Restablece tu contraseña',
    resetInstructions: 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña',
    email: 'Correo electrónico',
    emailPlaceholder: 'Ingresa tu correo',
    sendResetLink: 'Enviar enlace de restablecimiento',
    resetEmailSent: '¡Correo de restablecimiento enviado! Revisa tu bandeja de entrada.',
    resetFailed: 'Error al enviar correo de restablecimiento'
  }
};

export default auth;
