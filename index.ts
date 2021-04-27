import fs from 'fs';
import sax from 'sax';
import { OpeningTimes, NowUTC, Item } from './interfaces';
const strict: boolean = false;
const parser: sax.SAXParser = sax.parser(strict);

const d: Date = new Date();
let flagOffer: boolean = false;
let flagOpeningTimes: boolean = false;
let addTagValue: boolean;

let nodeOffer: string = '';

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

  const saxStream: sax.SAXStream = sax.createStream(strict, {
    lowercase: true,
    position: true,
  });

  saxStream.on('error', (e) => {
    console.error('saxStream error!', e);
    parser.resume();
  });

  saxStream.on('processinginstruction', (instructions) => {
    feedOutXMLWriteStream.write(
      `<?${instructions.name} ${instructions.body} ?>`,
      'utf-8',
    );
  });

  saxStream.on('text', (text) => {
    nodeOffer += text;
  });

  saxStream.on('opentag', (node) => {
    nodeOffer += `<${node.name}>`;

    if (node.name === 'offer') flagOffer = true;

    if (node.name === 'opening_times') flagOpeningTimes = true;
  });

  saxStream.on('cdata', (cdata) => {
    nodeOffer += `<![CDATA[${cdata}]]>`;

    if (flagOffer && flagOpeningTimes) {
      const opening_times: OpeningTimes = JSON.parse(cdata);
      const todayHours: Item[] = opening_times[nowUTC.weekDay];

      if (!(todayHours instanceof Array)) {
        addTagValue = false;
        return;
      }

      if (todayHours.length === 0) {
        addTagValue = false;
        return;
      }

      const result: boolean = todayHours.reduce((acc: boolean, el: Item): boolean => {
        const opening: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.opening}`,
        );
        const closing: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${el.closing}`,
        );
        const now: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${nowUTC.hour}:${nowUTC.minutes}`,
        );

        if (!(opening <= now && now <= closing)) {
          acc = false;
        }
        return acc;
      }, true);
      addTagValue = result;
      return; // TODO add tag now
    }
  });

  saxStream.on('closetag', (tag) => {
    nodeOffer += `</${tag}>`;

    if (tag === 'opening_times') {
      const newTag: string = `\n\t<is_active><![CDATA[${addTagValue}]]></is_active>`;

      nodeOffer += newTag;

      flagOpeningTimes = false;
    }
    if (tag === 'offer') flagOffer = false;

    feedOutXMLWriteStream.write(nodeOffer, 'utf-8');
    nodeOffer = '';
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
