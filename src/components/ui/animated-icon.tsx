import { forwardRef, useEffect, useRef, useImperativeHandle, type ComponentType, type ForwardRefExoticComponent } from "react";

type Handle = { startAnimation: () => void; stopAnimation: () => void };

interface AnimatedIconProps {
  icon: ForwardRefExoticComponent<any> | ComponentType<any>;
  size?: number;
  className?: string;
  /** CSS selector for the hover trigger element. Defaults to immediate parent. */
  triggerSelector?: string;
}

/**
 * Wrapper that bridges parent hover to an animated icon.
 * By default the animated icons only trigger when the mouse enters their tiny
 * inner wrapper. This component makes the wrapper fill its parent so hovering
 * the parent button/link reliably fires the animation.
 */
export const AnimatedIcon = forwardRef<Handle, AnimatedIconProps>(function AnimatedIcon(
  { icon: Icon, size = 18, className, triggerSelector },
  ref,
) {
  const iconRef = useRef<Handle>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    startAnimation: () => iconRef.current?.startAnimation(),
    stopAnimation: () => iconRef.current?.stopAnimation(),
  }));

  // Bridge parent hover → icon animation.
  useEffect(() => {
    const anchor = containerRef.current;
    if (!anchor) return;
    const el: HTMLElement | null = triggerSelector
      ? (anchor.closest(triggerSelector) as HTMLElement | null)
      : (anchor.parentElement as HTMLElement | null);
    if (!el) return;
    const enter = () => iconRef.current?.startAnimation();
    const leave = () => iconRef.current?.stopAnimation();
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [triggerSelector]);

  return (
    <span ref={containerRef} className={`inline-flex items-center justify-center ${className ?? ""}`}>
      <Icon ref={iconRef} size={size} isAnimated={false} />
    </span>
  );
});
