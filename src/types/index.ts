export type FilamentPriority = 'None' | 'Low' | 'Medium' | 'High';

export interface Filament {
  id: number;
  user_id: string;
  manufacturer: string;
  type: string;
  color: string;
  upc: string;
  photo_url: string | null;
  url: string | null;
  priority: FilamentPriority;
  created_at: string;
}

export interface Roll {
  id: number;
  filament_id: number;
  is_checked_out: number; // 0 = inventory, 1 = in use
  archived: number;       // 1 = empty spool
  created_at: string;
}

export interface FilamentWithRolls extends Filament {
  rolls: Roll[];
  in_use: number;
  in_inventory: number;
  archived_count: number;
}
