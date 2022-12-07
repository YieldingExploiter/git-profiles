/*!
 * @license "THE BEER-WARE LICENSE" (Revision 42):
 * <pleasego@nuke.africa> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return | YieldingExploiter
 */
const conf = {'config':true}

const crypto = require('crypto');

const isModuleInstalled = (module)=>{
  try {
    require.resolve(module)
    return true;
  } catch (e) {
    return false;
  }
}

let argIdx = 3;
let cloneType;
switch (process.argv[argIdx-1]) {
  case null:
  case undefined:
  case '':
  case 'i':
  case 'init':
    cloneType='init';
    break;
  case 's':
  case 'sm':
  case 'sub':
  case 'submod':
  case 'submodule':
    cloneType='submodule'
    break;
  case 'c':
  case 'clone':
    cloneType='clone';
    break;
  default:
    cloneType=(process.argv[argIdx-1].includes(':') || process.argv[argIdx-1].includes('/') ? 'clone' : 'unknown');
    argIdx--;
    break;
}

const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const path = require('path'), {execSync,spawn} = require('child_process');
const run = execSync;

(async()=>{
  const env = {
    ...process.env,
  };
  // git config init
  const initConfig = (location, silent)=>{
    for (const confName in conf.config) {
      if (Object.hasOwnProperty.call(conf.config, confName)) {
        const confVal = conf.config[confName];
        run(`git config "${confName}" "${confVal}"`, {
          cwd: location,
          stdio: 'inherit',
          env
        })
      }
    }
    if (!silent)
      console.log(`Configured Git as ${conf.name}`);
  }

  // find ssh agent
  if (conf.sshKey && process.platform !== 'win32') {
    try {
      const authFile = process.env.PROFILE_HELPER_KEY ? `/tmp/sshagentauth-${conf.socktmpname}+${crypto.createHmac('sha512',conf.socketEncr).update(process.env.PROFILE_HELPER_KEY).digest()}` : `/tmp/sshagentauth-${process.env.USER}-${conf.socktmpname}`
      const insecureStorageWarn = ()=>{
        console.log(`WARN: Storing the SSH Agent\'s Authentication Socket in an insecure format.`);
        console.log('      This is strongly discouraged. You should add the following lines to');
        console.log('      your .zshrc/.bashrc/your shell\'s equivalent:');
        console.log('');
        console.log('      export PROFILE_HELPER_KEY=$(tr -dc A-Za-z0-9 < /dev/urandom | head -c 512 | xargs)');
        console.log('      export PROFILE_HELPER_IV=$(tr -dc A-Za-z0-9 < /dev/urandom | head -c 512 | xargs)');
        console.log('');
        console.log(`      Once you\'ve done this, remove ${authFile}`);
        console.log('      This file will automatically be removed in 15 minutes.');
      }
      const getEncryptionKey = ()=>process.env.PROFILE_HELPER_KEY?crypto.scryptSync(process.env.PROFILE_HELPER_KEY,conf.socketEncr):conf.socketEncr
      const getEncryptionIv = ()=>process.env.PROFILE_HELPER_IV?crypto.scryptSync(process.env.PROFILE_HELPER_IV,conf.socketEncr):conf.socketEncr
      const addKey = ()=>{
        console.log('Adding Key to SSH-Agent');
        execSync(`ssh-add -t 900 ${conf.sshKey}`, {
          stdio: 'inherit',
          env,
        })
      }
      const ensureKey = ()=>{
        // assume agent exists, env is populated
        const name = execSync(`ssh-keygen -l -E sha512 -f ${conf.sshKey}`).toString('utf-8').trim();
        let keys = [];
        try {
          keys = execSync('ssh-add -l -E sha512').toString('utf-8').split('\n').map(v=>v.trim()).filter(v=>!!v)
        } catch (error) {}
        if (!keys.includes(name))
          addKey()
      }
      const spawnAgent = async ()=>{
        const r = execSync(`ssh-agent -s`)
        // for win32 support, this would need to def be replaced:
        const r2 = execSync(`${r}
echo SPLIT
echo "{\\"SSH_AGENT_PID\\":\\"\${SSH_AGENT_PID}\\",\\"SSH_AUTH_SOCK\\":\\"\${SSH_AUTH_SOCK}\\"}"`)
        try {
          const dataAsStr = r2.toString().split('SPLIT').pop().trim();
          const dataAsJSON = JSON.parse(dataAsStr)
          for (const envKey in dataAsJSON) {
            if (Object.hasOwnProperty.call(dataAsJSON, envKey)) {
              const envVal = dataAsJSON[envKey];
              env[envKey] = envVal
            }
          }
          if (!process.env.PROFILE_HELPER_KEY) {
            // for win32 support, this would def need to be replaced:
            spawn(`zsh`, [`-c`, `sleep 900 && rm "${authFile}"`], {
              detached:true,
              stdio:'ignore'
            })
            insecureStorageWarn()
          }
          const encryptionKey = getEncryptionKey().toString();
          const encryptionIv = getEncryptionIv().toString();
          const cipher = crypto.createCipheriv('aes-256-cbc',encryptionKey.substring(0,32),encryptionIv.substring(16,32));
          writeFileSync(authFile,Buffer.concat([cipher.update(Buffer.from(Buffer.from(dataAsStr).toString('hex'))),cipher.final()]))
          addKey()
        } catch (e) {
          console.warn('WARN: SSH Agent Functionality failed with',e.toString(),'\n      Block 2');
          if (conf.debug)
            console.error(e.output);
        }
      }
      const findSSHAgent = isModuleInstalled('ps-node') ? ()=>new Promise(resolve=>require('ps-node').lookup({command:'ssh-agent'},(err,list)=>resolve({err,list}))) : ()=>'noPSNode'//process.env.SSH_AGENT_PID
      const sshAgentLookup = await findSSHAgent();
      if (sshAgentLookup.err) return console.warn(err)
      else if (sshAgentLookup === 'noPSNode') {
        console.warn('ps-node is not installed. SSH-Agent Functionality Skipped.');
      }else if (!sshAgentLookup.list[0]) {
        await spawnAgent()
        ensureKey();
      } else if (!env.SSH_AGENT_PID || !env.SSH_AUTH_SOCK) {
        if (existsSync(authFile)) {
          const fileContents = readFileSync(authFile)
          const encryptionKey = getEncryptionKey().toString();
          const encryptionIv = getEncryptionIv().toString();
          const decipher = crypto.createDecipheriv('aes-256-cbc',encryptionKey.substring(0,32),encryptionIv.substring(16,32));
          let decrypted = Buffer.concat([decipher.update(fileContents),decipher.final()])
          if (!process.env.PROFILE_HELPER_KEY)
            insecureStorageWarn()
          const agentEnv = (JSON.parse(Buffer.from(decrypted.toString(),'hex').toString()));
          for (const envKey in agentEnv) {
            if (Object.hasOwnProperty.call(agentEnv, envKey)) {
              const envVal = agentEnv[envKey];
              env[envKey] = envVal
            }
          }
        } else await spawnAgent()
        ensureKey()
      } else {
        ensureKey()
      }
    } catch (e) {
      console.warn('WARN: SSH Agent Functionality failed with',e.toString(),'\n      Block 1');
      if (conf.debug)
        console.error(e);
    }
  }

  // per-arg
  const repo = process.argv[argIdx+0];
  const dir = process.argv[argIdx+1] ?? (repo ? repo.split('\\').join('/').split('/').pop() : null);

  try {
    if (cloneType === 'unknown') {
      // run specified command
      if (existsSync(join(process.cwd(),'.git')))
        initConfig(process.cwd(), true)
      const argv = process.argv.filter((_,idx)=>idx>=argIdx)
      run(`git ${argv.map(v=>`"${v}"`).join(' ')}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env
      })
    } else if (!repo || cloneType === 'init') {
      // init
      run(`git init`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env
      })
      initConfig(process.cwd())
    } else {
      // clone
      let cloneCommand = `git ${cloneType === 'submodule' ? 'submodule add' : 'clone'} "${repo.includes(':')?'':`${conf.cloneDomain}:`}${repo.startsWith('/')?conf.repoRoute:''}${repo}" "${dir}"`
      if (cloneType === 'clone')
        for (const confName in conf.preConfig) {
          if (Object.hasOwnProperty.call(conf.preConfig, confName)) {
            const confVal = conf.preConfig[confName];
            cloneCommand+=` --config "${confName}=${confVal}"`
          }
        }
      run(cloneCommand, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env
      })
      if (existsSync(path.join(process.cwd(),dir))) initConfig(path.join(process.cwd(),dir))
    }
  } catch (error) {}
  process.exit()
})()
