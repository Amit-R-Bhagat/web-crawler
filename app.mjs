import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as urlParser from "url";
import { Command } from "commander";
const program = new Command();

const getUrl = (link) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `http://localhost:10000${link}`;
  } else {
    return `http://localhost:10000/${link}`;
  }
};

const seenUrls = {};

const crawl = async ({ url }) => {
  if (seenUrls[url]) return;
  seenUrls[url] = true;
  console.log("crawling", url);
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();

  const imageUrls = $("img")
    .map((i, image) => image.attribs.src)
    .get();

  // if (imageUrls.length > 0) console.log(imageUrls);

  imageUrls.forEach((url) => {
    fetch(getUrl(url)).then((res) => {
      const filename = path.basename(url);
      const dest = fs.createWriteStream(`images/${filename}`);
      res.body.pipe(dest);
    });
  });

  const { host } = urlParser.parse(url);

  links
    .filter((link) => link.includes(host))
    .forEach((link) => {
      crawl({
        url: getUrl(link),
      });
    });
};

crawl({
  url: "http://localhost:10000",
});

program.command("crawl <url>").action((url) => {
  crawl({
    url: url,
  });
});

program.parse(process.argv);

// http://stevescooking.blogspot.com/
