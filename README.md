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

Am I gonna tell you how to use it? Maybe later, cba rn. The above is just my use-case & whatnot :shrug:<br/>
It's pretty self explanatory if you clone the repo

[profiles/example.json](profiles/example.json) will generate 1 file in your `$HOME/.bin`/`%USERPROFILE%\.bin`: `example-git` - To use it to clone, use `example-git YieldingExploiter/GitProfiles` - To init/config an existing repo, use `example-git` by itself. Both will first clone the repo, then git config it.


To generate executables based on profiles, run [`pnpm i`](https://pnpm.io), then `node generate-scripts.js`

### notes
cloneName can either be `user@domain` or an SSH Config Name.<br/>
`preConfig`s are applied during clone using `--config` added to the command.<br/>
conigs are applies post-clone by using `git config` in the repository.

if the repo route starts with `/`, the config's `repoRoute` key will be prepended to it

`$HOME/.bin` or `%USERPROFILE%\.bin` must be in your `PATH` (instructions: [Linux](https://www.howtogeek.com/658904/how-to-add-a-directory-to-your-path-in-linux/) | [MacOS](https://techpp.com/2021/09/08/set-path-variable-in-macos-guide/) (untested) | [Windows](https://stackoverflow.com/questions/44272416/how-to-add-a-folder-to-path-environment-variable-in-windows-10-with-screensho))

## license
### "THE BEER-WARE LICENSE" (Revision 42):

<pleasego@nuke.africa> wrote this file.  As long as you retain this notice you<br/>
can do whatever you want with this stuff. If we meet some day, and you think<br/>
this stuff is worth it, you can buy me a beer in return.   YieldingExploiter
