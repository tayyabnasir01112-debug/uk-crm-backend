import * as React from "react";
import { Check, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@shared/schema";

interface InventorySelectorProps {
  inventoryItems: InventoryItem[];
  onSelect: (item: InventoryItem) => void;
  disabled?: boolean;
  className?: string;
}

export function InventorySelector({
  inventoryItems,
  onSelect,
  disabled = false,
  className,
}: InventorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [skuQuery, setSkuQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!searchQuery && !skuQuery) return inventoryItems;
    
    const query = (searchQuery || skuQuery).toLowerCase();
    return inventoryItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const skuMatch = item.sku?.toLowerCase().includes(query);
      return nameMatch || skuMatch;
    });
  }, [inventoryItems, searchQuery, skuQuery]);

  const handleSelect = (item: InventoryItem) => {
    onSelect(item);
    setOpen(false);
    setSearchQuery("");
    setSkuQuery("");
  };

  const handleSkuSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skuQuery) {
      const item = inventoryItems.find(
        (i) => i.sku?.toLowerCase() === skuQuery.toLowerCase()
      );
      if (item) {
        handleSelect(item);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || inventoryItems.length === 0}
          className="h-8 w-8"
          title="Select from inventory"
        >
          <Search className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.name} ${item.sku || ""}`}
                  onSelect={() => handleSelect(item)}
                  disabled={item.quantity <= 0}
                  className={cn(
                    item.quantity <= 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Check className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                      {item.sku && (
                        <span className="text-xs text-muted-foreground">
                          (SKU: {item.sku})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {item.quantity} | £
                      {parseFloat(item.unitPrice.toString()).toFixed(2)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-2">
          <Input
            type="text"
            placeholder="Or enter SKU and press Enter"
            value={skuQuery}
            onChange={(e) => setSkuQuery(e.target.value)}
            onKeyDown={handleSkuSearch}
            className="h-9 text-sm"
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

