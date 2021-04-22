export interface Item {
  opening: string,
  closing: string
}

export interface OpeningTimes {
  '1': Item[],
  '2': Item[],
  '3': Item[],
  '4': Item[],
  '5': Item[],
  '6': Item[],
  '7': Item[],
  timezone: string,
}

export interface NowUTC {
  // weekDay: Range,
  weekDay: '1' | '2'|  '3' | '4' | '5' | '6' | '7',
  day: number,
  month: number,
  year: number,
  hour: number,
  minutes: number,
}