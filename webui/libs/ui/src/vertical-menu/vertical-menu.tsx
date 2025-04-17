export type MenuItem = {
  text: React.ReactNode;
  id: string;
  active?: boolean;
  completed?: boolean;
  started?: boolean;
  error?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type VerticalMenuProps = {
  items: MenuItem[];
  className?: string;
};

function MenuItemComponent({ item, index }: { item: MenuItem; index: number }) {
  return (
    <div
      role="menuitem"
      className={`cursor-pointer py-4 px-3 font-medium text-sm border-r border-b border-neutral-content relative flex items-center ${
        item.active
          ? 'bg-primary/5 text-primary border-r-transparent'
          : ' bg-base-100'
      }`}
      onClick={item.onClick}
      aria-current={item.active ? 'true' : undefined}
      aria-disabled={item.disabled}
    >
      {item.active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
      )}
      {!item.disabled && (
        <>
          {item.completed && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-success"></div>
          )}
          {item.started && !item.completed && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>
          )}
          {item.error && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
          )}
        </>
      )}
      <div className="flex">
        <div className="w-6 flex-shrink-0">{index}.</div>
        <div
          className={`${
            item.disabled ? 'text-base-content/50 line-through' : ''
          }`}
        >
          {item.text}
        </div>
      </div>
    </div>
  );
}

export function VerticalMenu({ items, className }: VerticalMenuProps) {
  return (
    <div
      role="menu"
      className={`overflow-auto w-full max-w-[270px] flex flex-col divide-y divide-neutral-content rounded-l-lg ${
        className || ''
      }`}
    >
      {items.map((item, index) => (
        <MenuItemComponent key={item.id} item={item} index={index + 1} />
      ))}
    </div>
  );
}

export default VerticalMenu;
