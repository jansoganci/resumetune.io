const auth = {
  // Login Page
  login: {
    title: 'Sign in to your account',
    orText: 'Or',
    createAccount: 'create a new account',
    email: 'Email address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    usePasswordInstead: 'Use password instead',
    useMagicLink: 'Use magic link',
    forgotPassword: 'Forgot password?',
    sendMagicLink: 'Send magic link',
    signIn: 'Sign in',
    backToHome: '← Back to home',
    magicLinkSent: 'Check your email for the magic link!',
    loginSuccess: 'Logged in successfully!',
    loginFailed: 'Login failed'
  },

  // Register Page
  register: {
    title: 'Create your account',
    orText: 'Or',
    signInExisting: 'sign in to existing account',
    email: 'Email address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Choose a password',
    passwordRequirement: 'Must be at least 6 characters',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Confirm your password',
    createAccount: 'Create account',
    agreeToTerms: 'By creating an account, you agree to our',
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    backToHome: '← Back to home',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    registerSuccess: 'Account created successfully!',
    registerFailed: 'Registration failed'
  },

  // Reset Password Page
  resetPassword: {
    checkEmailTitle: 'Check your email',
    checkEmailMessage: "We've sent a password reset link to",
    checkEmailInstructions: 'Click the link in the email to reset your password. The link will expire in 24 hours.',
    didntReceive: "Didn't receive the email? Try again",
    backToSignIn: 'Back to sign in',
    resetTitle: 'Reset your password',
    resetInstructions: "Enter your email address and we'll send you a link to reset your password",
    email: 'Email address',
    emailPlaceholder: 'Enter your email',
    sendResetLink: 'Send reset link',
    resetEmailSent: 'Password reset email sent! Check your inbox.',
    resetFailed: 'Failed to send reset email'
  }
};

export default auth;
