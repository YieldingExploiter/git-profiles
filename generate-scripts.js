#!/usr/bin/env node
/*!
 * @license "THE BEER-WARE LICENSE" (Revision 42):
 * <pleasego@nuke.africa> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return | YieldingExploiter
 */
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const template = fs.readFileSync(path.join(__dirname,'template.js'),'utf-8')
const binDir = `${process.env.HOME ?? process.env.USERPROFILE}/.bin`;
const debug = false;
const profile = (v)=>{
  const d = JSON.parse(fs.readFileSync(path.join(__dirname,'profiles',v),'utf-8'))
  d.socktmpname = crypto.randomBytes(64).toString('hex')
  d.socketEncr = crypto.randomBytes(64).toString('hex')
  
  if (debug) {
    d.socktmpname = Buffer.alloc(64,0).toString('hex')
    d.socketEncr = Buffer.alloc(64,1).toString('hex')
    d.debug=true;
  }

  fs.writeFileSync(path.join(__dirname,d.exe+'.js'),template.replace(`{'config':true}`,JSON.stringify(d)))
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir)
  console.log(`compile ${d.name} (${d.exe})`);
  execSync(`pkg -t node18 "${path.join(__dirname,d.exe+'.js')}"${debug?` --public --no-bytecode`:''} -o "${binDir}/${d.exe}"`, {
    stdio: 'inherit'
  })
  fs.rmSync(path.join(__dirname,d.exe+'.js'))
}
if (process.argv[2]) profile(process.argv[2])
else fs.readdirSync(path.join(__dirname,'profiles')).forEach(v=>profile(v))