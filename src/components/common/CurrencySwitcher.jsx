import React, { useState } from 'react';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-medium border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700">
          <span>{currency.flag}</span>
          <span>{currency.code}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search currency..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c); setOpen(false); setSearch(''); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                currency.code === c.code
                  ? "bg-purple-50 text-purple-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              )}
            >
              <span className="text-base">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{c.code}</span>
                <span className="text-gray-400 ml-1.5 text-xs truncate">{c.name}</span>
              </div>
              <span className="text-gray-400 text-xs">{c.symbol}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}