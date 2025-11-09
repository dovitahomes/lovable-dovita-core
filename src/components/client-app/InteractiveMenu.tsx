import React, { useState, useRef, useEffect, useMemo } from 'react';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  activeIndex?: number;
  onItemClick?: (index: number) => void;
}

const defaultAccentColor = 'hsl(var(--primary))';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ 
  items, 
  accentColor,
  activeIndex: controlledActiveIndex,
  onItemClick 
}) => {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;

  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 7;
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' prop is invalid or missing.");
      return [];
    }
    return items;
  }, [items]);

  useEffect(() => {
    if (activeIndex >= finalItems.length) {
      setInternalActiveIndex(0);
    }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    if (onItemClick) {
      onItemClick(index);
    } else {
      setInternalActiveIndex(index);
    }
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]);

  return (
    <nav
      className="client-menu"
      role="navigation"
      aria-label="Navegación principal del cliente"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const isTextActive = isActive;

        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`client-menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
            aria-label={`${item.label}${isActive ? ' (página actual)' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(index);
              }
            }}
          >
            <div className="client-menu__icon" aria-hidden="true">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`client-menu__text ${isTextActive ? 'active' : ''}`}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
