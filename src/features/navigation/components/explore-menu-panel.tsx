"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, ChevronLeft } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

import type { MenuCategoryVM, MenuGroupVM, MenuProductVM } from "../model/types";

const triggerClass =
  "inline-flex cursor-pointer items-center gap-1 border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-0 pt-2 pb-3 font-[inherit] text-[17px] leading-7 font-medium text-fg-muted outline-none select-none hover:border-accent hover:text-fg data-[popup-open]:border-accent data-[popup-open]:text-fg data-[popup-open]:[&>svg]:rotate-180";

const rowClass =
  "flex min-h-11 cursor-default items-center gap-3 rounded-lg px-3 text-start text-sm text-fg outline-none select-none data-[highlighted]:bg-surface-alt";

const popupClass =
  "origin-[var(--transform-origin)] rounded-panel border border-line-strong bg-surface p-2 shadow-lg outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 transition-[scale,opacity] duration-100 ease-out";

function ProductRow({ product }: { product: MenuProductVM }) {
  return (
    <Menu.LinkItem
      render={<AppLink href={product.href} />}
      closeOnClick
      className="flex cursor-default items-start gap-3 rounded-lg px-2 py-2 text-start no-underline outline-none select-none data-[highlighted]:bg-surface-alt"
    >
      {product.image ? (
        <Image
          src={product.image}
          alt=""
          width={56}
          height={36}
          className="h-9 w-14 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span aria-hidden="true" className="h-9 w-14 shrink-0 rounded-md bg-surface-alt" />
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium text-fg">{product.title}</span>
        <span className="mt-1 flex items-baseline gap-2 text-xs text-fg-muted">
          <span dir="ltr" className="font-semibold text-accent">
            {product.price}
          </span>
          {product.originalPrice ? (
            <span dir="ltr" className="line-through">
              {product.originalPrice}
            </span>
          ) : null}
        </span>
      </span>
    </Menu.LinkItem>
  );
}

function CategorySubmenu({ category }: { category: MenuCategoryVM }) {
  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger className={rowClass}>
        <span className="flex-1 truncate">{category.name}</span>
        <span className="text-xs text-fg-muted tabular-nums">{category.count}</span>
        <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner side="inline-end" align="start" sideOffset={4} className="z-[60] outline-none">
          <Menu.Popup className={`${popupClass} w-80`}>
            <Menu.LinkItem render={<AppLink href={category.href} />} closeOnClick className={rowClass}>
              كل النتائج في {category.name}
            </Menu.LinkItem>
            <Menu.Separator className="my-1 h-px bg-line" />
            {category.products.length > 0 ? (
              category.products.map((product) => <ProductRow key={product.key} product={product} />)
            ) : (
              <p className="m-0 px-3 py-2 text-xs text-fg-muted">لا توجد عناصر منشورة بعد.</p>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

function GroupSubmenu({ group }: { group: MenuGroupVM }) {
  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger className={rowClass}>
        <span className="flex-1">{group.label}</span>
        <span className="text-xs text-fg-muted tabular-nums">{group.count}</span>
        <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner side="inline-end" align="start" sideOffset={4} className="z-[60] outline-none">
          <Menu.Popup className={`${popupClass} max-h-[min(70vh,32rem)] w-64 overflow-y-auto`}>
            <Menu.LinkItem render={<AppLink href={group.href} />} closeOnClick className={rowClass}>
              كل {group.label}
            </Menu.LinkItem>
            <Menu.Separator className="my-1 h-px bg-line" />
            {group.categories.map((category) => (
              <CategorySubmenu key={category.id} category={category} />
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

/** Udemy-style cascading menu: product group → categories → the category's top items. */
export function ExploreMenuPanel({ groups }: { groups: MenuGroupVM[] }) {
  return (
    <DirectionProvider direction="rtl">
      <Menu.Root>
        <Menu.Trigger openOnHover delay={80} className={triggerClass}>
          استكشف
          <ChevronDown aria-hidden="true" className="size-4 transition-transform" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={8} className="z-[60] outline-none">
            <Menu.Popup className={`${popupClass} w-64`}>
              {groups.map((group) =>
                group.categories.length > 0 ? (
                  <GroupSubmenu key={group.type} group={group} />
                ) : (
                  <Menu.LinkItem
                    key={group.type}
                    render={<AppLink href={group.href} />}
                    closeOnClick
                    className={rowClass}
                  >
                    <span className="flex-1">{group.label}</span>
                    <span className="text-xs text-fg-muted tabular-nums">{group.count}</span>
                  </Menu.LinkItem>
                ),
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </DirectionProvider>
  );
}
