"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type MotionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function delayStyle(delay: number): CSSProperties {
  return { "--motion-delay": `${Math.max(0, delay)}ms` } as CSSProperties;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageEntrance({ children, className, delay = 0 }: MotionProps) {
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    setMotionEnabled(true);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={joinClasses(
        "motion-page-entrance",
        motionEnabled ? "motion-page-entrance--enabled" : undefined,
        visible ? "motion-page-entrance--visible" : undefined,
        className,
      )}
      style={delayStyle(delay)}
    >
      {children}
    </div>
  );
}

export function MotionReveal({ children, className, delay = 0 }: MotionProps) {
  const element = useRef<HTMLDivElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window) || !element.current) return;

    setMotionEnabled(true);
    const observer = new window.IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(element.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={element}
      className={joinClasses(
        "motion-reveal",
        motionEnabled ? "motion-reveal--enabled" : undefined,
        visible ? "motion-reveal--visible" : undefined,
        className,
      )}
      style={delayStyle(delay)}
    >
      {children}
    </div>
  );
}
