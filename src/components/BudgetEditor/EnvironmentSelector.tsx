import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EnvironmentTemplate } from '@/types/assetLibrary';

interface EnvironmentSelectorProps {
  templates: EnvironmentTemplate[];
  value: string;
  onChange: (value: string) => void;
  onCreateStandard: (name: string) => void;
  onCreateTemporary: (name: string) => void;
}

export function EnvironmentSelector({
  templates,
  value,
  onChange,
  onCreateStandard,
  onCreateTemporary
}: EnvironmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const matchingTemplate = templates.find(
    t => t.name.toLowerCase() === searchValue.toLowerCase()
  );

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setSearchValue(currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Selecione ou digite um ambiente..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Digite o nome do ambiente..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="space-y-2 p-2">
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum ambiente encontrado com esse nome
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onCreateStandard(searchValue);
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Ambiente Padrão: "{searchValue}"
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onCreateTemporary(searchValue);
                  setOpen(false);
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                Criar Ambiente Temporário: "{searchValue}"
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup>
            {templates.map((template) => (
              <CommandItem
                key={template.id}
                value={template.name}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === template.name ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  )}
                </div>
                {template.image_library?.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-2">
                    {template.image_library.length} {template.image_library.length === 1 ? 'imagem' : 'imagens'}
                  </div>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
