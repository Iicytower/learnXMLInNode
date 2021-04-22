import saxStream from 'sax-stream';
import fs from 'fs';
import { ReadStream, WriteStream } from 'node:fs';

try {
  const feedXMLReadStream: ReadStream = fs.createReadStream(
    './Test xml/feed_sample.xml',
    {
      encoding: 'utf-8',
    },
  );

  const feedOutXMLWriteStream: WriteStream = fs.createWriteStream('./feed_out.xml', {
    encoding: 'utf-8',
  });
} catch (err) {
  console.error(err);
}

console.log('--------------------------------');
