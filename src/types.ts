export type Point = [number, number]

export interface Plot {
  id: string
  name: string
  size: Point
  beds: Bed[]
}

export interface Bed {
  id: string
  name: string
  size: Point
  position?: Point
  rotation?: number
  crops: Crop[]
}

export interface Crop {
  id: string
  name: string
  size: Point
  position?: Point
}
