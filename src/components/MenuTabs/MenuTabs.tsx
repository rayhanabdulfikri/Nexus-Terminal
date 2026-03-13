import "./MenuTabs.css"
import { useState, useRef, useEffect } from "react"

export type DropdownItem = {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  divider?: boolean;
  active?: boolean;
};

export type TabItem = {
  id: string;
  label: string;
  items?: DropdownItem[];
};

type TabsProps = {
  leftTabs?: TabItem[];
  rightLabel?: string;
}

function MenuTabs({ leftTabs = [], rightLabel = "" }: TabsProps) {
  const [openTab, setOpenTab] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenTab(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTabClick = (tab: TabItem) => {
    if (!tab.items || tab.items.length === 0) return;
    setOpenTab(prev => prev === tab.id ? null : tab.id);
  };

  return (
    <div className="menu-tabs" ref={ref}>
      <div className="menu-tabs-left">
        {leftTabs.map(tab => (
          <div key={tab.id} className="mt-tab-wrapper">
            <div
              className={`tab-item ${openTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.label}
            </div>

            {openTab === tab.id && tab.items && (
              <div className="mt-dropdown">
                {tab.items.map((item, i) =>
                  item.divider ? (
                    <div key={i} className="mt-dropdown-divider" />
                  ) : (
                    <div
                      key={i}
                      className={`mt-dropdown-item ${item.active ? "mt-item-active" : ""}`}
                      onClick={() => {
                        item.onClick?.();
                        setOpenTab(null);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="mt-shortcut">{item.shortcut}</span>}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="menu-tabs-right">{rightLabel}</div>
    </div>
  )
}

export default MenuTabs
