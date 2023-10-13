# Convenience script for Windows users to install and use the correct NodeJS version.
# Note:  this will not likely work for *nix users.

# bash flags: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html#The-Set-Builtin
set -e
set -x

nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
