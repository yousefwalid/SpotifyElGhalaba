require(`dotenv`).config({
	path: "config.env"
});
require(`mongoose`).connect(`mongodb://localhost`, (err) => {
	err && console.error(err);
})
