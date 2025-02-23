require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("node:dns");
let bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

let currentIndex = 1;
const arrayOfUrls = [
  { original_url: "", short_url: 0 },
  { original_url: "https://www.stackoverflow.com", short_url: 1 },
];

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// handle get requests to /api/shorturl/:shorturl
// redirect to the original_url using short_url
app.get(
  "/api/shorturl/:shorturl",
  (req, res) => {
    if(req.params.shorturl > arrayOfUrls.length - 1 || isNaN(req.params.shorturl)) {
      res.json({error:"No short URL found for the given input"});
    } else {
      res.redirect(arrayOfUrls[req.params.shorturl].original_url);
    }
  }
);

app.use(
  "/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    const urlInput = req.body.url;
    let short_url = undefined;

    // check for valid input - http(s)://example.domain
    if (isValidInput(urlInput)) {
      const url = new URL(urlInput).host;

      // check if domain is valid
      dns.lookup(url, (err, addr, family) => {
        if (err) {
          res.json({ error: "Invalid Hostname" });
        }
        else {
          //check if already exists
          let exists = false;
          for(let i = 0; i < arrayOfUrls.length; i++) {
            if (urlInput === arrayOfUrls[i].original_url) {
              exists = true;
              res.json(arrayOfUrls[i]);
              break;
            }
          }
          
          // if url doesn't already exist
          if(!exists) {
            console.log("url does not exist, adding to the array and generating shorturl...");
            // increment the current index (index represents the shorturl)
            currentIndex++;
            // insert the url into the array
            arrayOfUrls.push({ original_url: urlInput, short_url: currentIndex });
            // respond with json
            res.json(arrayOfUrls[currentIndex]);
          }
        }
      });
    } else {
      res.json({ error: "Invalid URL" });
    }
  }
);


const isValidInput = (input) => {
  try {
    const url = new URL(input);
    return /^https?:\/\//.test(input); // Ensure "http://" or "https://" is present
  } catch (e) {
    return false;
  }
};

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
