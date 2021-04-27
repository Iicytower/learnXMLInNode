export interface Item {
  opening: string;
  closing: string;
}

export type DayKeys = 1 | 2 | 3 | 4 | 5 | 6 | 7;
// type DayKeys = '1' | '2' | '3' | '4' | '5' | '6' | '7';

export type OpeningTimes = {
  [key in DayKeys]: Item[];
} & {
  timezone: string;
};

export interface NowUTC {
  weekDay: DayKeys;
  day: number;
  month: number;
  year: number;
  hour: number;
  minutes: number;
}

export enum Events {
  error = 'error',
  processinginstruction = 'processinginstruction',
  text = 'text',
  opentag = 'opentag',
  cdata = 'cdata',
  closetag = 'closetag',
  end = 'end',
}