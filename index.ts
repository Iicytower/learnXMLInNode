import fs from 'fs';
import sax from 'sax';
import { OpeningTimes, NowUTC, Item, DayKeys, Events } from './models';
const strict: boolean = false;
const parser: sax.SAXParser = sax.parser(strict);

const date: Date = new Date();
let flagOpeningTimes: boolean = false;
let addTagValue: boolean;
let nodeOffer: string = '';
const count: {
  opened: number,
  closed: number, 
} = {
  opened: 0,
  closed: 0,
};

const nowUTC: NowUTC = {
  weekDay: date.getUTCDay() === 0 ? 7 : date.getUTCDay() as DayKeys,
  day: date.getUTCDate(),
  month: date.getUTCMonth(),
  year: date.getUTCFullYear(),
  hour: date.getUTCHours(),
  minutes: date.getUTCMinutes(),
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

  saxStream.on('processinginstruction', (instructions): void => {
    feedOutXMLWriteStream.write(
      `<?${instructions.name} ${instructions.body} ?>`,
      'utf-8',
    );
  });

  saxStream.on('text', (text): void => {
    nodeOffer += text;
  });

  saxStream.on('opentag', (node): void => {
    nodeOffer += `<${node.name}>`;


    if (node.name === 'opening_times') flagOpeningTimes = true;
  });

  saxStream.on('cdata', (cdata): void => {
    nodeOffer += `<![CDATA[${cdata}]]>`;

    if (flagOpeningTimes) {
      const opening_times: OpeningTimes = JSON.parse(cdata);
      const todayHours: Item[] = opening_times[nowUTC.weekDay];

      if (!Array.isArray(todayHours)) {
        addTagValue = false;
        return;
      }

      if (todayHours.length === 0) {
        addTagValue = false;
        return;
      }

      const result: boolean = todayHours.every((element) => {
        const opening: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${element.opening}`,
        );
        const closing: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${element.closing}`,
        );
        const now: Date = new Date(
          `${nowUTC.year}.${nowUTC.month}.${nowUTC.day} ${nowUTC.hour}:${nowUTC.minutes}`,
        );

        return (opening <= now && now <= closing);
      });
      
      addTagValue = result;
      return;
    }
  });

  saxStream.on('closetag', (tag): void => {
    nodeOffer += `</${tag}>`;

    if (tag === 'opening_times') {
      const newTag: string = `\n\t<is_active><![CDATA[${addTagValue}]]></is_active>`;
      if(addTagValue) count.opened++;
      if(!addTagValue) count.closed++;

      nodeOffer += newTag;

      flagOpeningTimes = false;
    }

    feedOutXMLWriteStream.write(nodeOffer, 'utf-8');
    nodeOffer = '';
  });

  saxStream.on('end', (): void => {

    console.log(`There is ${count.opened} opened and ${count.closed} closed.`)
    console.log('done with saxStream');
    parser.close();
  });

  feedXMLReadStream.pipe(saxStream);

} catch (err) {
  console.error('Error: \n', err);
}
