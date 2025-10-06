import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Image as ImageIcon, Upload } from 'lucide-react';
import { useAssetLibrary } from '@/hooks/useAssetLibrary';
import { Asset } from '@/types/assetLibrary';
import { useDebounce } from '@/hooks/useDebounce';

interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assetId: string, assetUrl: string) => void;
  selectedAssetId?: string;
}

const CATEGORIES = ['Cozinha', 'Sala', 'Quarto', 'Banheiro', 'Externa', 'Escritório'];

export const ImagePicker = ({ open, onOpenChange, onSelect, selectedAssetId }: ImagePickerProps) => {
  const { assets, loading, fetchAssets, uploadAsset } = useAssetLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (open) {
      fetchAssets({
        search: debouncedSearch,
        categories: selectedCategories
      });
    }
  }, [open, debouncedSearch, selectedCategories, fetchAssets]);
  
  const handleSelect = (asset: Asset) => {
    onSelect(asset.id, asset.url);
    onOpenChange(false);
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await uploadAsset(file, {
        categories: selectedCategories,
        tags: []
      });
      
      if (result) {
        await fetchAssets({
          search: debouncedSearch,
          categories: selectedCategories
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Escolher Imagem de Capa</DialogTitle>
        </DialogHeader>
        
        {/* Busca e Filtros */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Botão de Upload */}
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('asset-upload-input')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Upload'}
            </Button>
            <input
              id="asset-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          
          {/* Categorias */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedCategories(prev =>
                    prev.includes(cat)
                      ? prev.filter(c => c !== cat)
                      : [...prev, cat]
                  );
                }}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Grid de Imagens */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma imagem encontrada</p>
              <p className="text-sm">Faça upload de uma nova imagem para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden 
                    border-2 transition-all hover:scale-105 hover:shadow-lg
                    ${selectedAssetId === asset.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                  `}
                >
                  <img
                    src={asset.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedAssetId === asset.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <ImageIcon className="text-primary" size={32} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
