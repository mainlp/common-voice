# Common Voice

This project is a fork of the [Common Voice project](https://github.com/common-voice/common-voice) for collecting spoken dialect data.

### Setup
 - clone the repo
 - install [Docker](https://docs.docker.com/engine/install/) and docker compose
 - start the Docker engine
 - cd to the repo root and run ```docker compose up web``` (this will take quite some time when run the first time)

(Tested on a Windows machine with Docker engine running, and docker compose from WSL instance)
### Working with the code
  - Backend code is located under ```/server```
  - Frontend code is located under ```/web```
  - ...
### TODOs
  - check security settings for deployment on a live server! ```docker-compose.yaml``` currently contains the database passwords. This is fine for local deployment, but on a live server we need to move this to some env file that is not uploaded to GitHub
  - adjust ```.env-local-docker``` for deployment on live server
  - Supertokens currently works only for local deployment. Needs to be adjusted for deployment on live server
  - Test the full workflow of speaking/listening on the live server
  - The live server requires tls certificates (so it runs on https instead of http). Otherwise, browsers do not allow access to microphone. Certificates need to be updated from time to time
