export interface Asset {
  id: string;
  url: string;
  width?: number;
  height?: number;
  mime_type: string;
  checksum: string;
  categories: string[];
  tags: string[];
  copyright_info?: string;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AssetFilters {
  categories?: string[];
  tags?: string[];
  search?: string;
}

export interface AssetChangeLog {
  id: string;
  entity_type: 'asset' | 'category' | 'tag';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'merge';
  changed_by?: string;
  changes?: Record<string, any>;
  created_at: string;
}

export interface ProposalTemplateSettings {
  id: string;
  user_id: string;
  main_cover_asset_id?: string;
  default_environment_asset_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetEnvironmentMapping {
  id: string;
  user_id: string;
  asset_id: string;
  environment_name_pattern: string;
  priority: number;
  created_at: string;
  updated_at: string;
}
