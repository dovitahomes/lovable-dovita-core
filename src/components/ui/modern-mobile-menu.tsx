import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';

export type IconComponentType = ElementType<{ className?: string }>;

export interface MobileMenuItem {
  label: string;
  icon: IconComponentType;
  href: string;
}

export interface MobileMenuProps {
  items?: MobileMenuItem[];
  accentColor?: string;
}

const defaultAccentColor = 'var(--brand-accent, var(--accent-foreground))';

export const ModernMobileMenu: React.FC<MobileMenuProps> = ({ items, accentColor }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const finalItems = useMemo(() => {
    if (!items || !Array.isArray(items) || items.length < 2 || items.length > 7) {
      console.warn('ModernMobileMenu: items inválidos (debe tener entre 2-7 items). Usando array vacío.');
      return [];
    }
    return items;
  }, [items]);

  const activeIndex = useMemo(
    () => Math.max(0, finalItems.findIndex(it => location.pathname.startsWith(it.href))),
    [finalItems, location.pathname]
  );

  useEffect(() => {
    console.log('🔍 ModernMobileMenu Debug:', {
      itemsCount: finalItems.length,
      items: finalItems.map(i => i.label),
      location: location.pathname,
      activeIndex,
      isMobile: window.innerWidth < 768
    });
  }, [finalItems, location.pathname, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const el = itemRefs.current[activeIndex];
      const tx = textRefs.current[activeIndex];
      if (el && tx) el.style.setProperty('--lineWidth', `${tx.offsetWidth}px`);
    };
    setLineWidth();
    window.addEventListener('resize', setLineWidth);
    return () => window.removeEventListener('resize', setLineWidth);
  }, [activeIndex, finalItems]);

  const navStyle = useMemo(
    () => ({ '--component-active-color': accentColor || defaultAccentColor } as React.CSSProperties),
    [accentColor]
  );

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50 md:hidden
        pb-[max(env(safe-area-inset-bottom),0px)] pt-2
        bg-[color:var(--client-nav-bg,rgba(12,18,40,0.72))] backdrop-blur
        border-t border-[color:var(--client-nav-border,rgba(255,255,255,0.08))]
        flex items-center justify-around
      "
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            ref={el => (itemRefs.current[index] = el)}
            onClick={() => navigate(item.href)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
            className="
              group relative flex flex-col items-center justify-center gap-1 px-3 py-2
              text-xs font-medium
              text-[color:var(--client-nav-fg,#c8cbe0)]
              hover:text-white transition-colors
            "
          >
            <div className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
              <Icon className={`h-5 w-5 ${isActive ? 'text-[color:var(--component-active-color)]' : ''}`} />
            </div>
            <strong
              ref={el => (textRefs.current[index] = el)}
              className={`leading-none ${isActive ? 'text-[color:var(--component-active-color)]' : ''}`}
            >
              {item.label}
            </strong>
            <span
              aria-hidden
              className={`absolute -top-0.5 h-0.5 rounded-full transition-all duration-300
                ${isActive ? 'bg-[color:var(--component-active-color)] w-[var(--lineWidth)]' : 'w-0 bg-transparent'}
              `}
            />
          </button>
        );
      })}
    </nav>
  );
};
