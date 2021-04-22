import fs from 'fs';
import { ReadStream, WriteStream } from 'node:fs';
import sax, { SAXParser, SAXStream } from 'sax';
import { JSDOM } from 'jsdom';
const strict: boolean = false;
const parser: sax.SAXParser = sax.parser(strict);

const now = new Date();

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

  var saxStream: sax.SAXStream = sax.createStream(strict, { lowercase: true, });

  saxStream.on('error', function (e) {
    // unhandled errors will throw, since this is a proper node
    // event emitter.
    console.error('saxStream error!', e);
    // clear the error
    parser.resume();
  });

  console.log(saxStream);
  saxStream.on('opentag', function (node) {
    // same object as above
    if (node.name === 'offer') {

      console.log(node);
    }
  });

  saxStream.on('doctype', function (text) {
    // same object as above
    console.log(text);
  });

  saxStream.on('closetag', function (tag) {
    // same object as above
    if (tag === 'offer') console.log('=================', tag);
  });

  saxStream.on('end', () => {
    console.log('done with saxStream');
  });

  feedXMLReadStream.pipe(saxStream).pipe(feedOutXMLWriteStream);

  console.log('------------------------------');
} catch (err) {
  console.error('Error: \n', err);
}
