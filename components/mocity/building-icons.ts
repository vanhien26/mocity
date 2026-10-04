import {
  Landmark,
  Plane,
  TowerControl,
  Trees,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import {
  FcBullish,
  FcClapperboard,
  FcDepartment,
  FcDatabase,
  FcElectricity,
  FcGraduationCap,
  FcHome,
  FcIcons8Cup,
  FcMoneyTransfer,
  FcSafe,
  FcShop,
} from 'react-icons/fc';
import type { IconType } from 'react-icons';
import type { BuildingIconKey } from '@/lib/mocity/types';

/**
 * Map icon cong trinh.
 *
 * 13/17 key dung Flat Color Icons (icons8/flat-color-icons qua react-icons/fc,
 * MIT) - mau sac sinh dong hop phong cach game casual. 4 key KHONG CO ban
 * tuong duong trong bo nay (am thuc, cay xanh, may bay, ky quan) nen GIU
 * LAI Lucide line-icon lam fallback - con hon mot icon gan dung sai nghia.
 *
 * `IconType` cua react-icons va `LucideIcon` deu nhan props {size, className,
 * color...} nen dung chung duoc o moi noi dang render `BUILDING_ICON[key]`.
 */
export const BUILDING_ICON: Record<BuildingIconKey, LucideIcon | IconType> = {
  store: FcShop,
  utensils: Utensils,
  shoppingBag: FcShop,
  coffee: FcIcons8Cup,
  landmark: Landmark,
  server: FcDatabase,
  graduation: FcGraduationCap,
  trees: Trees,
  building: FcDepartment,
  tower: TowerControl,
  piggy: FcSafe,
  film: FcClapperboard,
  plane: Plane,
  wallet: FcMoneyTransfer,
  trendingUp: FcBullish,
  zap: FcElectricity,
  home: FcHome,
};
