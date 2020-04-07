npm i
docker network create sp8
docker container run --name test_db --network sp8 mongo4-bionic
# Make sure you have the write env vars, for a sure local deploy:
mv ~/spotify/envvars/DOCKER_LOCAL_ENV ./config.env
docker image build -t spotyify-el8alaba-back .
docker run --name sp8-back --network sp8 spotyify-el8alaba-back:latest
