import {
  Building2,
  Coffee,
  Film,
  GraduationCap,
  Home,
  Landmark,
  PiggyBank,
  Plane,
  Server,
  ShoppingBag,
  Store,
  TowerControl,
  Trees,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { BuildingIconKey } from '@/lib/mocity/types';

/**
 * Map icon cong trinh. Dung lucide theo chuan repo - khong emoji, khong svg inline.
 * Khoa nam trong types.ts de data va UI khong lech nhau.
 */
export const BUILDING_ICON: Record<BuildingIconKey, LucideIcon> = {
  store: Store,
  utensils: Utensils,
  shoppingBag: ShoppingBag,
  coffee: Coffee,
  landmark: Landmark,
  server: Server,
  graduation: GraduationCap,
  trees: Trees,
  building: Building2,
  tower: TowerControl,
  piggy: PiggyBank,
  film: Film,
  plane: Plane,
  wallet: Wallet,
  trendingUp: TrendingUp,
  zap: Zap,
  home: Home,
};
