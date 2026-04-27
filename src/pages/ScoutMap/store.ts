import { create } from 'zustand';
import type { Player, MapLayer, Level, EntityLayer } from './data';

export interface MapProfileData {
  id: number;
  name: string;
  avatar: string;
  city: string;
  province: string;
  age: number;
  position: string;
  club: string;
  tags: string[];
  score: number;
  potential: string;
  heat: { views7d: number; followers: number };
  radar: {
    visible: boolean;
    dimensions: string[];
    values: number[];
  };
  physical: {
    visible: boolean;
    items: { name: string; value: string; percentile: number }[];
  };
  timeline: { date: string; type: string; title: string; summary: string }[];
  reports: { id: number; type: string; author: string; score: number; summary: string }[];
  permissions: {
    canViewRadar: boolean;
    canViewPhysical: boolean;
    canViewReports: boolean;
    canContact: boolean;
  };
}

interface ScoutMapState {
  selectedLayer: MapLayer;
  selectedEntityLayer: EntityLayer;
  selectedPlayers: Player[];
  detailPlayerId: string | null;
  detailPlayer: MapProfileData | null;
  mapLevel: Level;
  currentProvince: string | null;
  currentCity: string | null;
  isBasketExpanded: boolean;

  setSelectedLayer: (layer: MapLayer) => void;
  setSelectedEntityLayer: (layer: EntityLayer) => void;
  addPlayerToCompare: (player: Player) => boolean;
  removePlayerFromCompare: (playerId: string) => void;
  clearCompareBasket: () => void;
  toggleBasketExpanded: () => void;
  setBasketExpanded: (expanded: boolean) => void;
  setDetailPlayerId: (id: string | null) => void;
  setDetailPlayer: (player: MapProfileData | null) => void;
  setMapLevel: (level: Level) => void;
  setCurrentProvince: (province: string | null) => void;
  setCurrentCity: (city: string | null) => void;
  isPlayerInBasket: (playerId: string) => boolean;
}

const MAX_COMPARE_PLAYERS = 4;

export const useScoutMapStore = create<ScoutMapState>((set, get) => ({
  selectedLayer: 'density',
  selectedEntityLayer: 'all',
  selectedPlayers: [],
  detailPlayerId: null,
  detailPlayer: null,
  mapLevel: 'country',
  currentProvince: null,
  currentCity: null,
  isBasketExpanded: false,

  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  setSelectedEntityLayer: (layer) => set({ selectedEntityLayer: layer }),

  addPlayerToCompare: (player) => {
    const { selectedPlayers } = get();
    if (selectedPlayers.some((p) => p.id === player.id)) {
      return true;
    }
    if (selectedPlayers.length >= MAX_COMPARE_PLAYERS) {
      return false;
    }
    set({ selectedPlayers: [...selectedPlayers, player], isBasketExpanded: true });
    return true;
  },

  removePlayerFromCompare: (playerId) => {
    const { selectedPlayers } = get();
    set({ selectedPlayers: selectedPlayers.filter((p) => p.id !== playerId) });
  },

  clearCompareBasket: () => set({ selectedPlayers: [], isBasketExpanded: false }),

  toggleBasketExpanded: () => set((state) => ({ isBasketExpanded: !state.isBasketExpanded })),
  setBasketExpanded: (expanded) => set({ isBasketExpanded: expanded }),

  setDetailPlayerId: (id) => set({ detailPlayerId: id }),
  setDetailPlayer: (player) => set({ detailPlayer: player }),

  setMapLevel: (level) => set({ mapLevel: level }),
  setCurrentProvince: (province) => set({ currentProvince: province }),
  setCurrentCity: (city) => set({ currentCity: city }),

  isPlayerInBasket: (playerId) => {
    return get().selectedPlayers.some((p) => p.id === playerId);
  },
}));
