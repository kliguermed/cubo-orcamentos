import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Image as ImageIcon, Upload, Star } from 'lucide-react';
import { useAssetLibrary } from '@/hooks/useAssetLibrary';
import { Asset } from '@/types/assetLibrary';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assetId: string, assetUrl: string) => void;
  selectedAssetId?: string;
}

const CATEGORIES = ['Cozinha', 'Sala', 'Quarto', 'Banheiro', 'Externa', 'Escritório'];

export const ImagePicker = ({ open, onOpenChange, onSelect, selectedAssetId }: ImagePickerProps) => {
  const { assets, loading, fetchAssets, uploadAsset } = useAssetLibrary();
  const { toast } = useToast();
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

  const handleToggleDefault = async (asset: Asset, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newDefaultValue = !asset.is_default;

      // Se está marcando como padrão, desmarcar todos os outros
      if (newDefaultValue) {
        await supabase
          .from('assets')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      // Atualizar o asset atual
      const { error } = await supabase
        .from('assets')
        .update({ is_default: newDefaultValue })
        .eq('id', asset.id);

      if (error) throw error;

      toast({
        title: newDefaultValue ? 'Imagem padrão definida' : 'Marca de padrão removida',
        description: newDefaultValue 
          ? 'Esta imagem será usada como padrão para ambientes'
          : 'Imagem não é mais a padrão'
      });

      // Recarregar assets
      await fetchAssets({
        search: debouncedSearch,
        categories: selectedCategories
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
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
                <div key={asset.id} className="relative group">
                  <button
                    onClick={() => handleSelect(asset)}
                    className={`
                      w-full relative aspect-square rounded-lg overflow-hidden 
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
                    {asset.is_default && (
                      <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1.5">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                    )}
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div 
                      className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1.5 cursor-pointer"
                      onClick={(e) => handleToggleDefault(asset, e)}
                    >
                      <Checkbox 
                        checked={asset.is_default || false}
                        className="border-white data-[state=checked]:bg-yellow-500"
                      />
                      <span className="text-xs text-white font-medium">Marcar como padrão</span>
                    </div>
                  </div>
                </div>
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
