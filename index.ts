import fs from 'fs';
import { ReadStream, WriteStream } from 'node:fs';
import { Parser } from 'node-expat';
import { parseString } from 'xml2js';
const parser: Parser = new Parser('UTF-8');

const feedXMLReadStream: ReadStream = fs.createReadStream('./Test xml/feed_sample.xml', {
  encoding: 'utf-8',
});

// const feedOutXMLWriteStream: WriteStream = fs.createWriteStream('feed_out.xml', {
//   encoding: 'utf-8',
// })

feedXMLReadStream.addListener('data', (data) => {
  parser.on('startElement', function (name, attrs) {
    if (name === 'offer') {

      console.log('name, att', name, attrs);

      parser.on('text', function (text) {
        console.log('text', text);
      });

    }
  });

  // if open now should be add true
  parser.on('endElement', function (name) {
    // console.log(name)
  });

  parser.on('error', function (error) {
    // console.error(error)
  });

  parser.write(data);
});

console.log('------------------------------');
