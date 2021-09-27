import { API_KEY } from "./settings.js";
import Weather from "./weather.js";

const weather = new Weather(API_KEY);
// weather.setUnits("standard");

const locationInput = document.querySelector("[data-input]");
const weatherButton = document.querySelector("[data-button]");
const weatherCity = document.querySelector(".weather__city");
const weatherIcon = document.querySelector("[data-icon]");

weatherButton.addEventListener("click", (event) => {
	event.preventDefault();
	const location = locationInput.value.trim();
	if (location == null || location === "") return;

	weather
		.getCurrentByCityName(location)
		.then((current) => {
			console.log(current);

			weatherCity.innerHTML = `${current.sys.country}, ${current.name}<br />${
				current.main.temp
			} &deg;C | ${weather.celsiusToFahrenheit(current.main.temp)} &deg;F`;
			weatherIcon.src = weather.getWeatherIcon(current.weather[0].icon);
		})
		.catch((err) => {
			console.error(err);

			weatherCity.innerHTML = "City not found";
		});
});
