const fetch = require("node-fetch");
const isUrlHttp = require("is-url-http");
const cheerio = require("cheerio");
var fs = require("fs");
let allLinksStack = [];

let linksQueue = [];
let maxCrawlingDepth = 3;
let newDepth = 0;
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  // function to add data to linked list
  add(data) {
    const newNode = new ListNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.length++;
    return this;
  }
  //function to add data to tail
  addToTail(data) {
    let newNode = new ListNode(data);
    if (this.head === null) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next !== null) {
      current = current.next;
    }
    current.next = newNode;
  }
  // function to insert data to linked list at a particular index
  addAtPosition(data, position) {
    let newNode = new ListNode(data);
    if (position === 1) {
      newNode.next = this.head;
      this.head = newNode;
      return;
    }
    let current = this.head;
    let i = 1;
    while (i < position - 1 && current) {
      current = current.next;
      i++;
    }
    if (current) {
      newNode.next = current.next;
      current.next = newNode;
    }
  }

  printAll() {
    let current = this.head;
    while (current) {
      console.log(current.data);
      current = current.next;
    }
  }

  getAll() {
    let allLinks = [];
    let current = this.head;
    while (current) {
      if (Array.isArray(current.data.data.url)) {
        allLinks.push(...current.data.data.url);
      } else {
        allLinks.push(current.data.data.url);
      }

      current = current.next;
    }
    return allLinks;
  }
  getSize() {
    let count = 0;
    let node = this.head;
    while (node) {
      count++;
      node = node.next;
    }
    return count;
  }

  getNthData(index) {
    let current = this.head;
    let count = 0;
    while (current != null) {
      if (count == index) return current.data;
      count++;
      current = current.next;
    }
  }
}
class ListNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}
const checkifExist = (arrayobj, url) => {
  const exist = arrayobj.find(item => {
    return item.url ? item.url === url : item === url;
  });
  if (exist) {
    return true;
  } else {
    false;
  }
};

const getAllImages = async () => {
  try {
    let results = [];
    for (let i = 0; i < allLinksStack.length; i++) {
      let response = await fetch(allLinksStack[i].url);
      let html = await response.text();
      let $ = cheerio.load(html);
      const allImages = $("img")
        .map((index, image) => image.attribs.src)
        .get();

      allImages.forEach(images => {
        let obj = {
          imageUrl: images,
          srcUrl: allLinksStack[i].url,
          depth: allLinksStack[i].depth,
        };
        results.push(obj);
      });
    }
    fs.writeFileSync("results.json", JSON.stringify(results), function (err) {
      if (err) throw err;
      console.log("complete");
    });
  } catch (e) {
    console.log(e);
  }
};
const urlWithInitialDepth = "https://scrapeme.live/shop/";

crawlBFS(urlWithInitialDepth, 3);

async function crawlBFS(startURL, maxDepth = 3) {
  maxCrawlingDepth = maxDepth;
  let firstNode = new ListNode({
    url: startURL,
    depth: 0,
  });
  let list = new LinkedList();
  list.add(firstNode);
  for (let i = 0; i < maxDepth; i++) {
    const index = list.getSize() - 1;
    const data = list.getNthData(index);
    await findLinks(data.data, list, newDepth);
    newDepth++;
  }
  getAllImages();
  console.log(allLinksStack);
}

const getUrl = link => {
  if (link) {
    if (link.includes("https://scrapeme.live/shop/page")) {
      return link;
    } else {
      return;
    }
  }
};

async function findLinks(linkObj, list, position) {
  //  console.log("Scraping URL : " + linkObj.url);
  let response;
  try {
    if (Array.isArray(linkObj.url)) {
      let forLoopNewLinks = [];
      for (let i = 0; i < linkObj.url.length; i++) {
        if (
          !checkifExist(allLinksStack, linkObj.url[i]) &&
          getUrl(linkObj.url[i])
        ) {
          const pushData = {
            depth: position,
            url: linkObj.url[i],
          };
          allLinksStack.push(pushData);
          let response = await fetch(linkObj.url[i]);
          let html = await response.text();
          let $ = cheerio.load(html);
          let linksforloop = $("a")
            .map((index, linkItem) => {
              const url = getUrl(linkItem.attribs.href);
              if (isUrlHttp && url && !checkifExist(allLinksStack, url)) {
                return url;
              } else {
                return;
              }
            })
            .get();
          if (linksforloop.length > 0) {
            for (let i = 0; i < linksforloop.length; i++) {
              if (!checkifExist(forLoopNewLinks, linksforloop[i])) {
                forLoopNewLinks.push(linksforloop[i]);
              }
            }
          }
        }
      }
      const forLoopNewLinkObj = new ListNode({
        url: forLoopNewLinks,
        depth: 1,
      });
      list.add(forLoopNewLinkObj);
    } else {
      if (!checkifExist(allLinksStack, linkObj.url)) {
        const pushData = {
          depth: position,
          url: linkObj.url,
        };
        allLinksStack.push(pushData);
        let response = await fetch(linkObj.url);
        let html = await response.text();
        let $ = cheerio.load(html);
        let links = $("a")
          .map((index, linkItem) => {
            const url = getUrl(linkItem.attribs.href);
            if (isUrlHttp && url && !checkifExist(allLinksStack, url)) {
              return url;
            } else {
              return;
            }
          })
          .get();

        if (links.length > 0) {
          const newLinkObj = new ListNode({ url: links, depth: 1 });
          list.add(newLinkObj);
          const allLinksVal = list.getAll();
        }
      }
    }
  } catch (err) {
    console.log("Something Went Wrong...", err);
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
