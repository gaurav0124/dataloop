

const fetch = require('node-fetch');
const cheerio  = require('cheerio');
var fs = require('fs');

const visitedUrls = {};
//let allLinks = [];
const urlWithInitialDepth = "https://scrapeme.live/shop/";
const results = [];
let currentDepth  = 0;
const finalDepth = 3;
const checkDepth = (link) => {
  if(link.includes('http')){
    return;
  }
  const linkArray = link.split('/').filter(Boolean);
  if(linkArray.length < finalDepth){
    return linkArray.join('/');
  }
}

const getUrl = (link) => {
  if(link){
    if(link.includes('http')){
      console.log("yes")
      return link
    }else {
      return `${urlWithInitialDepth}/${link}`
      }
  }
  
}

const crawlLinks = async (url) => {
  if(visitedUrls[url]) return;
  visitedUrls[url] = true;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  

  const allLinks = $('a').map((index, linkItem) => {
    return getUrl(linkItem.attribs.href);
  }).get();
  
   const allImages = $('img').map((index,image) => image.attribs.src).get();
   
   allImages.forEach((images) => {
    let obj = {
      "imageUrl":images,
      "srcUrl":url,
      "depth": currentDepth
    }
    results.push(obj);
   })

  if(currentDepth !== 3){
    allLinks.forEach((link) => crawlLinks(getUrl(link)));
    currentDepth ++;
  }
  console.log(results)
const data = JSON.stringify(results);
fs.writeFileSync ("results.json", data, function(err) {
  if (err) throw err;
  console.log('complete');
  }
);
};


crawlLinks(urlWithInitialDepth);
