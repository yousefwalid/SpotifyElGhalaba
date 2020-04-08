# Stop and Delete containers
docker container stop back-prod
docker container rm back-prod

# Delete images
docker image rm back

# Build image
docker image build -t back .

# Run container
docker container run -d \
	 --name back-prod \
	 --restart on-failure \
	 --network sp8 \
	 -p 8080:80 \
 	back:latest
