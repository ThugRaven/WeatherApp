import { API_KEY } from "./settings.js";
import Weather from "./weather.js";

const weather = new Weather(API_KEY);
// weather.setUnits("standard");

const locationInput = document.querySelector("[data-input]");
const weatherButton = document.querySelector("[data-button]");
const weatherTemp = document.querySelector(".temp__value");
const weatherFeelsTemp = document.querySelector(".temp__feels-value");
const weatherCity = document.querySelector(".current__location-name");
const weatherIcon = document.querySelector("[data-icon]");
const weatherMainDesc = document.querySelector(".current__main-desc");
const weatherSecondDesc = document.querySelector(".current__second-desc");
const weatherPressure = document.querySelector("[data-pressure]");
const weatherVisibility = document.querySelector("[data-visibility]");
const weatherHumidity = document.querySelector("[data-humidity]");
const weatherSunrise = document.querySelector("[data-sunrise]");
const weatherWind = document.querySelector("[data-wind]");
const weatherSunset = document.querySelector("[data-sunset]");

history.replaceState("", null, "");

window.addEventListener("popstate", (event) => {
	console.log(
		"location: " + document.location + ", state: " + JSON.stringify(event.state)
	);
});

weatherButton.addEventListener("click", (event) => {
	event.preventDefault();
	const location = locationInput.value.trim();
	if (location == null || location === "") return;

	weather
		.getCurrentByCityName(location)
		.then((current) => {
			console.log(current);

			history.pushState({ city: location }, "city", `?city=${location}`);

			weatherTemp.innerHTML = displayTemp(current.main.temp);
			weatherFeelsTemp.innerHTML = displayTemp(current.main.feels_like);
			weatherCity.innerHTML = `${current.name}, ${current.sys.country}`;
			weatherIcon.src = weather.getWeatherIcon(current.weather[0].icon);
			weatherMainDesc.innerHTML = current.weather[0].main;
			weatherSecondDesc.innerHTML = current.weather[0].description;
			weatherPressure.innerHTML = current.main.pressure;
			weatherVisibility.innerHTML = current.visibility / 1000;
			weatherHumidity.innerHTML = current.main.humidity;
			// weatherSunrise.innerHTML = displayTime(new Date(current.sys.sunrise));
			weatherWind.innerHTML = current.wind.speed;
			// weatherSunset.innerHTML = displayTime(new Date(current.sys.sunset));
		})
		.catch((err) => {
			console.error(err);

			weatherCity.innerHTML = "City not found";
		});
});

function displayTemp(temp) {
	return Math.round(temp);
}

function displayDate(date) {
	return date.toLocaleDateString(undefined, {
		weekday: "long",
		day: "numeric",
		month: "short",
	});
}

function displayTime(time) {
	return time.toLocaleDateString(undefined, {
		hour: "numeric",
		minute: "numeric",
	});
}
