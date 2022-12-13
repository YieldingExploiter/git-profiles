/*!
 * @license "THE BEER-WARE LICENSE" (Revision 42):
 * <pleasego@nuke.africa> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return | YieldingExploiter
 */
const { execSync } = require('child_process');
const prompts = require('prompts'), fs = require('fs'), path = require('path');
const convertPath = (path)=>{
  path=path.replace(/~/gui,process.env.HOME??process.env.USERPROFILE)
  for (const envName in process.env) {
    if (Object.hasOwnProperty.call(process.env, envName)) {
      const envVal = process.env[envName];
      path=path.split(`%${envName}%`).join(`$${envName}`).replace(new RegExp(`\\$\\{?${envName}\\}?`,'gui'),envVal);
    }
  }
  return path
}
const convertPathCb = (cb)=>path=>{
  return cb(convertPath(path))
}
(async () => {
  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'What do you want to name the profile?',
      validate: v=>v.length === 0 ? 'Must be > 0 Characters' : true,
    },
    {
      type: 'text',
      name: 'exe',
      message: 'What executable name do you want? (ie `example-git`, `egit`, `eg`, ...)',
      validate: v=>v.length === 0 ? 'Must be > 0 Characters' : true,
    },
    {
      type: 'text',
      name: 'cloneDomain',
      message: 'What user@domain do you wish to use by default?',
      initial: 'git@github.com',
      validate: v=>(v.length === 0 || !v.includes('@')) ? 'Must specify a user@domain/user@ip' : v.includes(':') ? 'Must not include a :' : true,
    },
    {
      type: 'text',
      name: 'sshKey',
      message: 'Where is your SSH Key Located? (optional, recommended)',
      // prepare for da goofy ah validation function
      validate: convertPathCb(v=>v.length===0?true:v.toLowerCase().endsWith('.pub')?'Please specify the path to your private key.':!fs.existsSync(v)?'File does not exist':fs.statSync(v).isDirectory()?'Path is Directory':!(fs.readFileSync(v,'utf-8').startsWith('-----BEGIN OPENSSH PRIVATE KEY-----')||fs.readFileSync(v,'utf-8').startsWith('-----BEGIN RSA PRIVATE KEY-----'))?'Invalid OpenSSH Private Key':true)
    },
    {
      type: last=>last?'confirm':false,
      name: 'preConfig',
      message: 'Do you wish to configure core.sshCommand to use that SSH key in affected repos?',
      initial: process.platform!=='win32'
    },
    {
      type: 'text',
      name: 'config.user.name',
      message: 'What Git Username do you wish to use?',
      validate: v=>v.length === 0 ? 'Must be > 0 Characters' : true,
      initial: (_,values)=>values.name.toLowerCase().replace(/ /gui,'.'),
    },
    {
      type: 'text',
      name: 'config.user.email',
      message: 'What Git Email do you wish to use?',
      initial: (last)=>`${last?.toLowerCase()}@users.noreply.github.com`,
      validate: v=>v.length === 0 ? 'Must be > 0 Characters' : true,
    },
    {
      type: 'text',
      name: 'repoRoute',
      message: 'What repository root route would you like to use? (see https://s.astolfo.gay/git-profiles/r)',
      initial: (_,history)=>history['config.user.name'],
      validate: v=>v.length===0?'Must specify a repository route':true,
    },
    {
      type: 'confirm',
      name: 'dogpgsign',
      message: 'Do you wish to sign your commits with a GPG key?',
      initial: true,
    },
    {
      type: last=>last?'confirm':false,
      name: 'newgpgkey',
      message: 'Do you wish to generate a new GPG key?',
    },
    {
      type: last=>last?false:'text',
      name: 'existingkey',
      message: 'What is your existing key\'s Long-form Key ID?',
      hint: 'For more information, see https://s.astolfo.gay/findgpgk'
    },
    {
      type: (_,history)=>history.newgpgkey?history['config.user.email'].includes('noreply')?'text':false:false,
      name: 'existingkey',
      message: 'Your git email is a noreply email. Enter your GPG Key\'s Email if you want it to differ.',
      initial: (_,history)=>history['config.user.email']
    },
    {
      type: (_,values)=>values.dogpgsign?false:values.sshKey?'confirm':false,
      name: 'dosshsign',
      message: 'Do you wish to sign commits with your SSH key? (untested atm)'
    }
  ]);
  const cun = response['config.user.name']
  const cue = response['config.user.email']
  delete response['config.user.name']
  delete response['config.user.email']
  const preConfig = response.preConfig ? {
    'core.sshCommand': `ssh -i "${convertPath(response.sshKey)}"`
  } : {};
  if (process.platform === 'win32' && preConfig['core.sshCommand'])
    preConfig['core.sshCommand']=`ssh -i ${convertPath(response.sshKey).replace(/\\/gui,'/').replace(/ /gui,'\\\\ ')}`
  const data = {
    ...response,
    sshKey: convertPath(response.sshKey),
    preConfig,
    config: {
      'user.name': cun,
      'user.email': cue,
      ...preConfig,
    },
  }
  if (data.dogpgsign) {
    if (data.newgpgkey){
      execSync(`gpg --quick-gen-key ${process.platform!=='win32'?`"${data.config['user.name']} <${data.config['user.email']}>"`:data.config['user.email']} rsa4096 cert,sign,encrypt`, {
        stdio: 'inherit'
      })
      data.existingkey = (await prompts({
        type: 'text',
        name: 'key',
        message: 'Please paste the Key ID found below the "rsa4096 <date> [SC] [expires: <date>]"',
        validate: v=>v.trim().length===40?true:'Invalid Key - Must be 40 Characters.'
      })).key
    }
    data.config['user.signingkey'] = data.existingkey;
    data.config['commit.gpgsign'] = 'true';
    delete data.existingkey;
    delete data.newgpgkey;
    delete data.dogpgsign;
  }else if (data.dosshsign) {
    data.config['commit.gpgsign'] = 'true';
    data.config['gpg.format'] = 'ssh';
    data.config['user.signingkey'] = fs.readFileSync(convertPath(response.sshKey));
    delete data.dosshsign
  }
  const {isCorrect} = (await prompts({
    type: 'confirm',
    name: 'isCorrect',
    message: 'Is the above data correct?',
  }))
  if (isCorrect) {
    fs.writeFileSync(path.resolve(process.cwd(),'profiles',`${data.name.toLowerCase()}.json`), JSON.stringify(data,null,2));
    console.log('Wrote to Profile successfully!');
    const exPath = path.resolve(process.cwd(),'profiles','example.json');
    const {build,removeExample} = (await prompts([
    {
      type: ()=>fs.existsSync(exPath) ? 'confirm' : false,
      name: 'removeExample',
      message: 'Do you wish to remove the example profile?'
    },{
      type: 'confirm',
      name: 'build',
      message: 'Do you wish to build the profiles in the profiles directory?',
    }]))
    if (removeExample) fs.rmSync(exPath)
    if (build) require('./generate-scripts')
  }
})();