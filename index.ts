import fs from 'fs';
import { ReadStream, WriteStream } from 'node:fs';
import sax, { SAXParser, SAXStream } from 'sax';
import { OpeningTimes, NowUTC, Item } from "./interfaces";
import { JSDOM } from 'jsdom';
const strict: boolean = false;
const parser: sax.SAXParser = sax.parser(strict);

const d = new Date();

const nowUTC: NowUTC = {
  // @ts-ignore TODO
  weekDay: (d.getUTCDay() === 0) ? '7' : `${d.getUTCDay()}`,
  day: d.getUTCDate(),
  month: d.getUTCMonth(),
  year: d.getUTCFullYear(),
  hour: d.getUTCHours(),
  minutes: d.getUTCMinutes(),
}
console.log(nowUTC);

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

  var saxStream: sax.SAXStream = sax.createStream(strict, { lowercase: true, position: true, });

  saxStream.on('error', function (e) {
    // unhandled errors will throw, since this is a proper node
    // event emitter.
    console.error('saxStream error!', e);
    // clear the error
    parser.resume();
  });

  const close = saxStream.on('closetag', function (tag) {
    // same object as above
    if (tag === 'offer') {
      // console.log('=================', tag);
    }
  });

  saxStream.on('opentag', function (node) {
    // same object as above
    if (node.name === 'offer') {
      // console.log(parser);
      // console.log(node);
    }
  });

  saxStream.on('cdata', function (text) {
    if (text[0] === '{') {
      const opening_times: OpeningTimes = JSON.parse(text);
      // @ts-ignore TODO
      const todayHours: Item[] = opening_times[nowUTC.weekDay];

      if (!(todayHours instanceof Array)) {
        // add tag false
        // console.log(`<is_active><![CDATA[false]]></is_active>`);
        return;
      }

      if (todayHours.length === 0) {
        // add tag false
        // console.log(`<is_active><![CDATA[false]]></is_active>`);
        return;
      }

      const result: boolean = todayHours.reduce((acc: boolean, el: Item): boolean => {

        const previous: Date = new Date(`${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.opening}`);
        const next: Date = new Date(`${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.closing}`);
        const now: Date = new Date(`${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${nowUTC.hour}:${nowUTC.minutes}`);

        if (!(previous <= now && now <= next)) {
          acc = false
        }
        return acc
      }, true);
      const newTag: string = `<is_active><![CDATA[${result}]]></is_active>`;

      // add tag TODO
      // console.log(newTag);
      return;


    }
  });


  saxStream.on('end', () => {
    console.log('done with saxStream');
    parser.close();
  });

  feedXMLReadStream.pipe(saxStream).pipe(feedOutXMLWriteStream);

  console.log('------------------------------');
} catch (err) {
  console.error('Error: \n', err);
}
