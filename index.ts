import fs from 'fs';
import sax from 'sax';
import { OpeningTimes, NowUTC, Item } from './interfaces';
const strict: boolean = false;
const parser: sax.SAXParser = sax.parser(strict);

const d: Date = new Date();
let flagOffer: boolean = false;
let flagOpeningTimes: boolean = false;
let addTag: boolean;

const nowUTC: NowUTC = {
  // @ts-ignore TODO
  weekDay: d.getUTCDay() === 0 ? '7' : `${d.getUTCDay()}`,
  day: d.getUTCDate(),
  month: d.getUTCMonth(),
  year: d.getUTCFullYear(),
  hour: d.getUTCHours(),
  minutes: d.getUTCMinutes(),
};

try {
  const feedXMLReadStream: fs.ReadStream = fs.createReadStream(
    './Test xml/feed_sample.xml',
    {
      encoding: 'utf-8',
    },
  );

  const feedOutXMLWriteStream: fs.WriteStream = fs.createWriteStream('./feed_out.xml', {
    encoding: 'utf-8',
  });

  var saxStream: sax.SAXStream = sax.createStream(strict, {
    lowercase: true,
    position: true,
  });

  saxStream.on('error', function (e) {
    console.error('saxStream error!', e);
    parser.resume();
  });

  saxStream.on('opentag', function (node) {
    if (node.name === 'offer') {
      flagOffer = true;
    }
  });

  saxStream.on('opentag', function (node) {
    if (node.name === 'opening_times') {
      flagOpeningTimes = true;
    }
  });

  saxStream.on('cdata', function (cdata) {
    if (flagOffer && flagOpeningTimes) {
      const opening_times: OpeningTimes = JSON.parse(cdata);
      const todayHours: Item[] = opening_times[nowUTC.weekDay];

      if (!(todayHours instanceof Array)) {
        addTag = false;
        return;
      }

      if (todayHours.length === 0) {
        addTag = false;
        return;
      }

      const result: boolean = todayHours.reduce((acc: boolean, el: Item): boolean => {
        const previous: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.opening}`,
        );
        const next: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.closing}`,
        );
        const now: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${nowUTC.hour}:${nowUTC.minutes}`,
        );

        if (!(previous <= now && now <= next)) {
          acc = false;
        }
        return acc;
      }, true);
      addTag = result;
      return;
    }
  });

  saxStream.on('closetag', function (tag) {
    if (tag === 'opening_times') {
      const newTag: string = `<is_active><![CDATA[${addTag}]]></is_active>`;
      feedOutXMLWriteStream.write(newTag);
      flagOpeningTimes = false;
    }
  });

  saxStream.on('closetag', function (tag) {
    if (tag === 'offer') {
      flagOffer = false;
    }
  });

  saxStream.on('end', () => {
    console.log('done with saxStream');
    parser.close();
  });

  feedXMLReadStream.pipe(saxStream);

  console.log('------------------------------');
} catch (err) {
  console.error('Error: \n', err);
}
