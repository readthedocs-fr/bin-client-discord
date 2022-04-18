# Read The Bin

A simple discord bot, made for [Read the Docs](https://readthedocs-fr.github.io), to automatically replace long code
blocks with snippets using [rtd-bin](https://github.com/readthedocs-fr/bin).

## Contribution

After forking, do these commands:

```sh
git clone https://github.com/<your_username>/bin-client-discord
cd bin-client-discord

# we recommend you add this repo as an upstream remote
git remote add upstream https://github.com/readthedocs-fr/bin-client-discord

yarn install
```

_We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commits messages._

```sh
git checkout -b <branch_name>
# make somes changes

yarn lint # or lint-fix
yarn format
yarn test

git add .
git commit -m "conventional commit"
git push origin <branch_name>
```

## Environment vars

```sh
# From how many lines the bot should transform messages
MAX_LINES=20
# Bin URL with "/new" path
CREATE_BIN_URL=http://127.0.0.1:8012/new
# Your bot's token
DISCORD_TOKEN=
# Discord categories' ID, comma-separated
CATEGORIES=
# ms
REQUEST_TIMEOUT=5000
```
