# Common Voice

This project is a fork of the [Common Voice project](https://github.com/common-voice/common-voice) for collecting spoken dialect data.

### Setup
 - clone the repo
 - create a local ```.env-local-docker``` file. To get started, you can copy the values from ```.env-local-docker.example``` from this repo
 - install [Docker](https://docs.docker.com/engine/install/) and docker compose
 - start the Docker engine
 - cd to the repo root and run ```docker compose up web``` (this will take quite some time when run the first time)

(Tested on a Windows machine with Docker engine running, and docker compose from WSL instance)
### Working with the code
The live server requires https, because modern browsers will block access to the microphone oterhwise. However, for local development it is easier to work with the http version. To launch the website for local development, you need to ensure ```CV_PROD``` in ```.env-local-docker``` is set to false. Furhtermore, in ```server/src/server.ts``` exchange the listen function with this code block 
```
listen(): void {
    // Begin handling requests before clip list is loaded.
    /*const tls_files = {
      cert: fs.readFileSync("/code/certs/letsencrypt/live/lmslcis-commonvoice.srv.mwn.de/fullchain.pem"),
      key:  fs.readFileSync("/code/certs/letsencrypt/live/lmslcis-commonvoice.srv.mwn.de/privkey.pem")
    }*/

    const port = getConfig().SERVER_PORT;
    this.server = this.app.listen(port, () =>
      this.print(`listening at http://localhost:${port}`)
    );
    //https.createServer(tls_files, this.app).listen(port)
  }
```
Lastly, in ```docker-compose.yaml``` set the host port to 9000 instead of 443 (standard for https)
```
 web:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: web
    links:
      - db
      - redis
      - supertokens
    volumes:
      - .:/code
      - audio_data:/code/web/public/audio
    environment:
      - DOTENV_CONFIG_PATH=/code/.env-local-docker
    networks:
      - voice-web
    ports:
      - 9000:9000 <- this needs to be changed
```

You should now be able to launch the website on localhost. Below are a few pointers to important files:
  - Backend code is located under ```/server```
  - Frontend code is located under ```/web```
  - To import sentences that should be recorded add txt files under ```/server/data/<locale>/```
  - Entry point for the frontend is located under ```/web/src/app.tsx```
  - Entry point for the backend is located under ```/server/src/server.ts```
  - State is managed via a Redux store with the entry point located under ```/web/src/stores/root.ts```
  - Fronted API client is located under ```/web/src/services/api.ts```
### TODOs
  - check security settings for deployment on a live server! ```docker-compose.yaml``` currently contains the database passwords. This is fine for local deployment, but on a live server we need to move this to some env file that is not uploaded to GitHub
  - adjust ```.env-local-docker``` for deployment on live server
  - Supertokens currently works only for local deployment. Needs to be adjusted for deployment on live server
  - Test the full workflow of speaking/listening on the live server
  - The live server requires tls certificates (so it runs on https instead of http). Otherwise, browsers do not allow access to microphone. Certificates need to be updated from time to time
