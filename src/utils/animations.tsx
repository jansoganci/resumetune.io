import React from 'react';

// Animation utility classes following design guardrails
export const ANIMATION_CLASSES = {
  // Slide animations
  slideInFromBottom: 'animate-slideInFromBottom',
  slideInFromTop: 'animate-slideInFromTop',
  slideInFromLeft: 'animate-slideInFromLeft',
  slideInFromRight: 'animate-slideInFromRight',
  
  // Fade animations
  fadeIn: 'animate-fadeIn',
  fadeInScale: 'animate-fadeInScale',
  fadeInUp: 'animate-fadeInUp',
  
  // Success celebrations
  successPulse: 'animate-successPulse',
  bounceIn: 'animate-bounceIn',
  
  // Micro-interactions
  buttonPress: 'animate-buttonPress',
  shimmer: 'animate-shimmer',
  
  // Staggered delays
  delay75: 'animation-delay-75',
  delay150: 'animation-delay-150',
  delay300: 'animation-delay-300',
  delay450: 'animation-delay-450',
} as const;

// Animation wrapper component with intersection observer
interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation: keyof typeof ANIMATION_CLASSES;
  delay?: keyof typeof ANIMATION_CLASSES;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
  children,
  animation,
  delay,
  className = '',
  threshold = 0.1,
  triggerOnce = true
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, triggerOnce]);

  const animationClass = isVisible ? ANIMATION_CLASSES[animation] : 'opacity-0';
  const delayClass = delay ? ANIMATION_CLASSES[delay] : '';

  return (
    <div
      ref={elementRef}
      className={`${animationClass} ${delayClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

// Success celebration component
interface SuccessCelebrationProps {
  show: boolean;
  children: React.ReactNode;
  type?: 'pulse' | 'bounce' | 'scale';
  className?: string;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  show,
  children,
  type = 'pulse',
  className = ''
}) => {
  const animationClass = show 
    ? type === 'pulse' 
      ? ANIMATION_CLASSES.successPulse 
      : type === 'bounce'
      ? ANIMATION_CLASSES.bounceIn
      : ANIMATION_CLASSES.fadeInScale
    : '';

  return (
    <div className={`${animationClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

// Button with press animation
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400'
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm min-h-[44px] md:min-h-[32px]', // 44px for mobile touch targets
    md: 'px-4 py-2 text-sm min-h-[44px] md:min-h-[36px]',
    lg: 'px-6 py-3 text-base min-h-[48px]'
  };

  const pressAnimation = isPressed ? 'scale-95' : 'scale-100';
  const loadingAnimation = isLoading ? 'opacity-75' : '';

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick && !isLoading && !props.disabled) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pressAnimation} ${loadingAnimation} ${className}`.trim()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  );
};
