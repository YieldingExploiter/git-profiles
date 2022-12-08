<!--
 @license "THE BEER-WARE LICENSE" (Revision 42):
 <pleasego@nuke.africa> wrote this file. As long as you retain this notice you
 can do whatever you want with this stuff. If we meet some day, and you think
 this stuff is worth it, you can buy me a beer in return | YieldingExploiter
-->


# Profile-Based Git init & Git clone

Need to manage multiple GitHub/GitLab/Gitea Users with different SSH Keys?<br/>
Want to take a break of constantly running `git config user.name/user.email whatever`?<br/>
Well this project is for you!

### CLI Installation

1. `git clone https://github.com/YieldingExploiter/git-profiles/`
2. `cd git-profiles` into the directory
3. Ensure [pnpm](https://pnpm.io) is installed
4. Ensure NodeJS is installed by using `node --version`<br/>If it isn't, run `pnpm env use --global latest`
5. Run `pnpm i`
6. Run `node add-profile-cli`
7. Answer the questions | Make sure to select `y` for the last question.

> `$HOME/.bin` (`%USERPROFILE%\.bin` on Windows) must be in your `PATH` to be able to run the command. Instructions to add it can be found here: [Linux](https://www.howtogeek.com/658904/how-to-add-a-directory-to-your-path-in-linux/) | [MacOS](https://techpp.com/2021/09/08/set-path-variable-in-macos-guide/) (untested) | [Windows](https://stackoverflow.com/questions/44272416/how-to-add-a-folder-to-path-environment-variable-in-windows-10-with-screensho) (just switch to linux already)

### internal shit from pre-cli-install

[profiles/example.json](profiles/example.json) will generate 1 file in your `$HOME/.bin`/`%USERPROFILE%\.bin`: `example-git` - To use it to clone, use `example-git YieldingExploiter/GitProfiles` - To init/config an existing repo, use `example-git` by itself. Both will first clone the repo, then git config it.


To generate executables based on profiles, run [`pnpm i`](https://pnpm.io), then `node generate-scripts.js`

### ssh agent

> This requires the optional dependency `ps-node`. `pnpm i` will automatically install it by default.<br/>
> All options related to this will be ignored if `ps-node` isn't installed.<br/>
> ***This option won't work on Windows.***

If you want to automatically spawn `ssh-agent` to save your SSH key's credentials, simply set your profile's `sshKey` to the path of the SSH Key.<br/>
If we cannot find an existing `ssh-agent` running, we will spawn a new one.

> *The example includes this option. Remove it if you wish to not have ssh-agent functionality.*

#### securely storing shit

By default, we store SSH Agent Socket Information in a file encrypted using a key generated by [generate-scripts](./generate-scripts.js) on compilation.

This isn't ideal; you should specify a `PROFILE_HELPER_KEY` & a `PROFILE_HELPER_IV` in your environment variables.<br/>
You should specify them as such in your `.zshrc` or `.bashrc`:
```bash
export PROFILE_HELPER_KEY=$(tr -dc A-Za-z0-9 < /dev/urandom | head -c 512 | xargs)
export PROFILE_HELPER_IV=$(tr -dc A-Za-z0-9 < /dev/urandom | head -c 512 | xargs)
```

If you don't have those 2 variables present in your environment, you will receive a warning when saving/loading the SSH Agent's Socket Information, telling you to add those.

With these present, you will have one SSH Agent per terminal, as these variables are generated on shell open.

### submodules
if you specify `submod` as the first argument, it will act as `git submodule add <...>` - example: `example-git submod /GitProfiles`

### auto-clone
if your first argument includes a `:` or a `/`, it is assumed to be for `git clone`. Otherwise, it is assumed that you specified the git subcommand (excluding for `submod`&`sm`; `submodule` is still treated as a command where you specify what to do).

A blank command (`example-git`) is assumed to be `git init`.

> We don't assume everything is a clone as to allow git push/pull/whatever to use an [ssh-agent](#ssh-agent) started by us.
>
> If we don't detect an init, submod (NOT git submodule), or commit, we do not print `Configured Git as {profile.name}` after running the configuration commands. 

### repo routes

if the repo route starts with `/`, the config's `repoRoute` key will be prepended to it

example:<br/>
with a `repoRoute` of `exampleroute`, `example-git /test` would execute `git clone example-git ${cloneDomain}:example/test`

### notes
cloneName can either be `user@domain` or an SSH Config Name.<br/>
`preConfig`s are applied during clone using `--config` added to the command.<br/>
conigs are applies post-clone by using `git config` in the repository.

scripts are generated from [template.js](template.js)

### setting the binary name to git
will cause it to invoke itself as of now, might fix by adding an option to provide a custom git path later.

## license
### "THE BEER-WARE LICENSE" (Revision 42):

<pleasego@nuke.africa> wrote this file.  As long as you retain this notice you<br/>
can do whatever you want with this stuff. If we meet some day, and you think<br/>
this stuff is worth it, you can buy me a beer in return.   YieldingExploiter
