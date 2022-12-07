/*!
 * @license "THE BEER-WARE LICENSE" (Revision 42):
 * <pleasego@nuke.africa> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return | YieldingExploiter
 */
const conf = {'config':true}


const { existsSync } = require('fs');
const path = require('path'), {execSync} = require('child_process')
const run = execSync
// git config init
const initConfig = (location)=>{
  for (const confName in conf.config) {
    if (Object.hasOwnProperty.call(conf.config, confName)) {
      const confVal = conf.config[confName];
      run(`git config "${confName}" "${confVal}"`, {
        cwd: location,
        stdio: 'inherit'
      })
    }
  }
  console.log(`Configured git as ${conf.name}`);
}

// per-arg
const repo = process.argv[2];
const dir = process.argv[3] ?? (repo ? repo.split('\\').join('/').split('/').pop() : null);
try {
  if (!repo) {
    // init
    run(`git init`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    })
    initConfig(process.cwd())
  } else {
    // clone
    let cloneCommand = `git clone "${repo.includes(':')?'':`${conf.cloneDomain}:`}${repo}" "${dir.startsWith('/') ? conf.repoRoute : ''}${dir}"`
    for (const confName in conf.preConfig) {
      if (Object.hasOwnProperty.call(conf.preConfig, confName)) {
        const confVal = conf.preConfig[confName];
        cloneCommand+=` --config "${confName}=${confVal}"`
      }
    }
    run(cloneCommand, {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
    if (existsSync(path.join(process.cwd(),dir))) initConfig(path.join(process.cwd(),dir))
  }
} catch (error) {}