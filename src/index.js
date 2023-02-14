const fetch = require('node-fetch');
const isUrlHttp = require('is-url-http');
const cheerio = require('cheerio');
var fs = require('fs');

let seenLinks = {};

let rootNode = {};
let currentNode = {};

let linksQueue = [];
let printList = [];

let previousDepth = 0;
let maxCrawlingDepth = 3;
let results = [];

class CreateLink {
  constructor(linkURL, depth, parent) {
    this.url = linkURL;
    this.depth = depth;
    this.parent = parent;
    this.children = [];
  }
}
const urlWithInitialDepth = "https://scrapeme.live/shop/";

crawlBFS(urlWithInitialDepth, 1);

async function crawlBFS(startURL, maxDepth = 5) {
  maxCrawlingDepth = maxDepth;
  startLinkObj = new CreateLink(startURL, 0, null);
  rootNode = currentNode = startLinkObj;
  addToLinkQueue(currentNode);
  await findLinks(currentNode);
}

async function crawl(linkObj) {
  await findLinks(linkObj);
}

const getUrl = (link) => {
  if(link){
    if(link.includes('http')){
      return link
    }else {
      return;
      }
  }
  
}

async function findLinks(linkObj) {
  console.log("Scraping URL : " + linkObj.url);
  let response
  try {
    let response = await fetch(linkObj.url);
    let html = await response.text();
    let $ = cheerio.load(html);
    let links = $('a').map((index, linkItem) => {
      const url = getUrl(linkItem.attribs.href);
      if(isUrlHttp){
        return url;
      }else{
        return;
      }
      
    }).get();

    const allImages = $('img').map((index,image) => image.attribs.src).get();
   
   allImages.forEach((images) => {
      let obj = {
        "imageUrl":images,
        "srcUrl":linkObj.url,
        "depth": linkObj.depth
      }
      results.push(obj);
   });
    console.log(links);
    if (links.length > 0) {
      links.map(function (reqLink,x) {
        if (reqLink.includes("https://scrapeme.live")) {
          if (reqLink != linkObj.url) {
            const newLinkObj = new CreateLink(reqLink, linkObj.depth + 1, linkObj);
            addToLinkQueue(newLinkObj);
          }
        }
      });
    } else {
      console.log("No more links found for " + urlWithInitialDepth);
    }
    let nextLinkObj = getNextInQueue();
    if (nextLinkObj && nextLinkObj.depth <= maxCrawlingDepth) {
      console.log("depth====>",nextLinkObj.depth)
      await crawl(nextLinkObj);
    } else {
      fs.writeFileSync ("results.json", JSON.stringify(results), function(err) {
        if (err) throw err;
        console.log('complete');
        }
      );
    }
  } catch (err) {
    console.log("Something Went Wrong...", err);
  }
}

//Go all the way up and set RootNode to the parent node
function setRootNode() {
  while (currentNode.parent != null) {
    currentNode = currentNode.parent;
  }
  rootNode = currentNode;
}

function printTree() {
  addToPrintDFS(rootNode);
  console.log(printList.join("\n|"));
}

function addToPrintDFS(node) {
  let spaces = Array(node.depth * 3).join("-");
  printList.push(spaces + node.url);
  if (node.children) {
    node.children.map(function (i, x) {
      {
        addToPrintDFS(i);
      }
    });
  }
}

function addToLinkQueue(linkobj) {
  if (!linkInSeenListExists(linkobj)) {
    if (linkobj.parent != null) {
      linkobj.parent.children.push(linkobj);
    }
    linksQueue.push(linkobj);
    addToSeen(linkobj);
  }
}

function getNextInQueue() {
  let nextLink = linksQueue.shift();
  if (nextLink && nextLink.depth > previousDepth) {
    previousDepth = nextLink.depth;
    console.log(`------- CRAWLING ON DEPTH LEVEL ${previousDepth} --------`);
  }
  return nextLink;
}

function peekInQueue() {
  return linksQueue[0];
}

//Adds links we've visited to the seenList
function addToSeen(linkObj) {
  seenLinks[linkObj.url] = linkObj;
}

//Returns whether the link has been seen.
function linkInSeenListExists(linkObj) {
  return seenLinks[linkObj.url] == null ? false : true;
}