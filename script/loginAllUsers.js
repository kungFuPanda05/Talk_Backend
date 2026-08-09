import 'dotenv/config';
import config from '../config'


const db = require("../models")


import JWT from 'jsonwebtoken';
import { getBrowser, withNewPage } from '../src/puppeteer';

import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer'; // or your puppeteer singleton

async function simulateManyUsersWithContexts(users, {
  browser,               // a puppeteer Browser from your singleton
  frontendUrl,
  visitMs = 30000,       // how long to keep each page open
  blockResources = true, // block images/fonts/stylesheets to save RAM
}) {
  const contexts = [];

  for (const user of users) {
    const ctx = await browser.createIncognitoBrowserContext(); // isolates cookies
    contexts.push(ctx);
    (async () => {
      const page = await ctx.newPage();
      // reduce load
      if (blockResources) {
        await page.setRequestInterception(true);
        page.on('request', req => {
          const t = req.resourceType();
          if (['image','stylesheet','font'].includes(t)) req.abort();
          else req.continue();
        });
      }
      // set cookie in this context only
      await page.setCookie({
        name: 'token',
        value: user.token,
        url: frontendUrl,
        path: '/',
      });

      // small viewport to reduce memory
      await page.setViewport({ width: 800, height: 600 });

      await page.goto(frontendUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        .catch(err => console.warn('goto failed', err));

      // keep it open for 'visitMs' so user appears online
      await new Promise(r => setTimeout(r, visitMs));
      // close page & context when done
      try { await page.close(); } catch {}
      try { await ctx.close(); } catch {}
    })();
  }

  // return contexts so caller can close early if needed
  return contexts;
}



const JWTSign = (user, date)=>{
    return JWT.sign(
        {
            iss: config.app.name,
            sub: user.id,
            iat: date.getTime()
        },
        config.app.secret,
        {
            expiresIn: "30d"
        }
    );
}


const loginAllUsers = async() => {
    let users = await db.User.findAll({raw: true});
    for(let user of users){
        let token = JWTSign(user, new Date());
        user.token = token;  
    }
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const browser = await getBrowser();
    await simulateManyUsersWithContexts(users, { browser, frontendUrl, visitMs: 60000 });
}

loginAllUsers();