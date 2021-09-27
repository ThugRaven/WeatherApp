import { API_KEY } from "./settings.js";
import Weather from "./weather.js";

const weather = new Weather(API_KEY);

const weatherButton = document.querySelector("[data-button]");

weatherButton.addEventListener("click", () => {
	weather.getCurrentWeather("Kraków").then((weather) => {
		console.log(weather);
	});
});
