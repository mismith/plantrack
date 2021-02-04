import { reactive } from 'vue'

export interface DataList {
  crops: Crop[]
  plants: Plant[]
  beds: Bed[]
  plots: Plot[]
  events?: any // @TODO
}
export interface Entity {
  id: string
  name?: string
  createdAt?: string // @TODO: make required
}
export interface Crop extends Entity {
}
export interface Entry extends Entity {
  eventId: string
  payload?: Record<string, any>
}
export interface Plant extends Entity {
  cropId: string
  bedId: string
  entries?: Entry[]
}
export interface Bed extends Entity {
  plotId: string
}
export interface Plot extends Entity {
}

const data = reactive<DataList>({
  crops: [
    { id: 'TM786', name: 'Tomatoes - Cherry / Sungold' },
    { id: 'PP670', name: 'Peppers / Sweetheart' },
    { id: 'CU403', name: 'Cucumbers / Picolino' },
    { id: 'BR189', name: 'Broccoli / Aspabroc Broccolini' },
    { id: 'MU550', name: 'Broccoli - Gai Lan / Green Pearl' },
    { id: 'SW753', name: 'Swiss Chard / Celebration' },
    { id: 'HR1090', name: 'Peppermint / Peppermint' },
    { id: '140658', name: 'Oregano' },
    { id: 'HR1019', name: 'Basil / Genovese' },
    { id: 'HR1024', name: 'Dill / Ella' },
    { id: 'HR1073', name: 'Cilantro / Santo Long Standing' },
    { id: 'PL571', name: 'Parsley / Dark Green Italian' },
    { id: 'MS504', name: 'Arugula / Astro' },
    { id: 'MS554', name: 'Arugula / Wasabi' },
    { id: 'MS565', name: 'Arugula / Ballezia' },
    { id: 'KL429', name: 'Kale / Vates Blue Scots Curled' },
    { id: 'KL431', name: 'Kale / Red Ursa' },
    { id: 'SP701', name: 'Spinach / Bloomsdale Savoy' },
    { id: 'SP714', name: 'Spinach / Renegade' },
    { id: 'SP715', name: 'Spinach / Seaside' },
    { id: 'LT509', name: 'Lettuce - Butterhead / Blushed Butter Oak' },
    { id: 'LT458', name: 'Lettuce - Butterhead / Butter Crunch' },
    { id: 'LT541', name: 'Lettuce - Iceberg / Dillon' },
    { id: 'LT456', name: 'Lettuce / Grand Rapids TBR' },
    { id: '6868800059', name: 'Lettuce / Blend - Salad Greens' },
    { id: 'FRALP', name: 'Strawberry / Alexandria - Alpine' },
    { id: 'FR820', name: 'Strawberry / Mignonette' },
    { id: 'FR850', name: 'Strawberry / Hot Pink Berri Basket' },
    { id: '5875', name: 'Strawberry / Heirloom Pineapple' },
    { id: 'AR103', name: 'Artichoke / Imperial Star' },
    { id: 'AGBASG', name: 'Basil / Genovese' },
    { id: 'AGBAST', name: 'Basil / Thai' },
    { id: 'ASPAR', name: 'Parsley / Italian' },
    { id: 'AGMINT', name: 'Mint' },
    { id: 'AGDILL', name: 'Dill' },
    { id: 'AGCHV', name: 'Chives' },
    { id: 'AGTHYM', name: 'Thyme' },
  ],
  plants: [
    { id: 'plant-1', bedId: 'moist', cropId: 'TM786', name: 'Rudy' },
    { id: 'plant-2', bedId: 'moist', cropId: 'PP670', name: 'Pépé' },
  ],
  beds: [
    { id: 'dry', plotId: 'nursery' },
    { id: 'moist', plotId: 'nursery' },
    { id: 'A1', plotId: 'wall' },
    { id: 'A2', plotId: 'wall' },
    { id: 'A3', plotId: 'wall' },
    { id: 'A4', plotId: 'wall' },
    { id: 'A5', plotId: 'wall' },
    { id: 'A6', plotId: 'wall' },
    { id: 'A7', plotId: 'wall' },
    { id: 'B1', plotId: 'wall' },
    { id: 'B2', plotId: 'wall' },
    { id: 'B3', plotId: 'wall' },
    { id: 'B4', plotId: 'wall' },
    { id: 'B5', plotId: 'wall' },
    { id: 'B6', plotId: 'wall' },
    { id: 'C1', plotId: 'wall' },
    { id: 'C2', plotId: 'wall' },
    { id: 'C3', plotId: 'wall' },
    { id: 'C4', plotId: 'wall' },
    { id: 'C5', plotId: 'wall' },
    { id: 'C6', plotId: 'wall' },
    { id: 'C7', plotId: 'wall' },
    { id: 'D1', plotId: 'wall' },
    { id: 'D2', plotId: 'wall' },
    { id: 'D3', plotId: 'wall' },
    { id: 'D4', plotId: 'wall' },
    { id: 'D5', plotId: 'wall' },
    { id: 'D6', plotId: 'wall' },
    { id: 'E1', plotId: 'wall' },
    { id: 'E2', plotId: 'wall' },
    { id: 'E3', plotId: 'wall' },
    { id: 'E4', plotId: 'wall' },
    { id: 'E5', plotId: 'wall' },
    { id: 'E6', plotId: 'wall' },
    { id: 'F1', plotId: 'wall' },
    { id: 'F2', plotId: 'wall' },
    { id: 'F3', plotId: 'wall' },
    { id: 'F4', plotId: 'wall' },
    { id: 'F5', plotId: 'wall' },
    { id: 'G1', plotId: 'wall' },
    { id: 'G2', plotId: 'wall' },
    { id: 'G3', plotId: 'wall' },
    { id: 'G4', plotId: 'wall' },
    { id: 'G5', plotId: 'wall' },
    { id: 'G6', plotId: 'wall' },
    { id: 'BU1', plotId: 'buckets' },
    { id: 'BU2', plotId: 'buckets' },
    { id: 'BU3', plotId: 'buckets' },
    { id: 'TR1', plotId: 'trough' },
    { id: 'TR2', plotId: 'trough' },
    { id: 'TR3', plotId: 'trough' },
    { id: 'TR4', plotId: 'trough' },
    { id: 'TR5', plotId: 'trough' },
    { id: 'TR6', plotId: 'trough' },
    { id: 'AG1', plotId: 'aerogarden' },
    { id: 'AG2', plotId: 'aerogarden' },
    { id: 'AG3', plotId: 'aerogarden' },
    { id: 'AG4', plotId: 'aerogarden' },
    { id: 'AG5', plotId: 'aerogarden' },
    { id: 'AG6', plotId: 'aerogarden' },
  ],
  plots: [
    { id: 'nursery' },
    { id: 'wall' },
    { id: 'buckets' },
    { id: 'trough' },
    { id: 'aerogarden' },
  ],
  events: [
    { id: 'seed' },
    { id: 'sprout' },
    { id: 'leaf' },
    { id: 'flower' },
    { id: 'fruit' },
    { id: 'transplant' },
    { id: 'water' },
    { id: 'feed' },
    { id: 'prune' },
    { id: 'harvest' },
    { id: 'cull' },
  ],
})

export default data
