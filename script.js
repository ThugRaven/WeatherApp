import { API_KEY } from "./settings.js";
import Weather from "./weather.js";

const weather = new Weather(API_KEY);
// weather.setUnits("standard");

const locationInput = document.querySelector("[data-input]");
const weatherButton = document.querySelector("[data-button]");
const weatherCity = document.querySelector(".current__location-name");
const weatherDate = document.querySelector(".current__date");
const weatherTemp = document.querySelector(".temp__value");
const weatherFeelsTemp = document.querySelector(".temp__feels-value");
const weatherIcon = document.querySelector("[data-icon]");
const weatherMainDesc = document.querySelector(".current__main-desc");
const weatherSecondDesc = document.querySelector(".current__second-desc");
const weatherPressure = document.querySelector("[data-pressure]");
const weatherVisibility = document.querySelector("[data-visibility]");
const weatherHumidity = document.querySelector("[data-humidity]");
const weatherSunrise = document.querySelector("[data-sunrise]");
const weatherWind = document.querySelector("[data-wind]");
const weatherSunset = document.querySelector("[data-sunset]");
const weatherCloudiness = document.querySelector("[data-cloudiness]");
const weatherWindDirection = document.querySelector("[data-wind-deg]");
const weatherWindPointer = document.querySelector(".wind-pointer");
const weatherPrecipitation = document.querySelector("[data-precipitation]");

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

			weatherCity.innerHTML = `${current.name}, ${current.sys.country}`;
			weatherDate.innerHTML = displayUNIXDate(current.dt);
			weatherTemp.innerHTML = displayTemp(current.main.temp);
			weatherFeelsTemp.innerHTML = displayTemp(current.main.feels_like);
			weatherIcon.src = weather.getWeatherIcon(current.weather[0].icon);
			weatherMainDesc.innerHTML = current.weather[0].main;
			weatherSecondDesc.innerHTML = current.weather[0].description;
			weatherPressure.innerHTML = current.main.pressure;
			weatherVisibility.innerHTML = current.visibility / 1000;
			weatherHumidity.innerHTML = current.main.humidity;
			weatherSunrise.innerHTML = displayUNIXTime(current.sys.sunrise);
			weatherWind.innerHTML = current.wind.speed;
			weatherSunset.innerHTML = displayUNIXTime(current.sys.sunset);
			weatherCloudiness.innerHTML = current.clouds.all;
			weatherWindDirection.innerHTML = `${current.wind.deg}&deg;`;
			weatherWindPointer.style.setProperty(
				"transform",
				`rotate(${current.wind.deg}deg)`
			);
			if (current.rain != null && current.rain["1h"] != null) {
				weatherPrecipitation.innerHTML = current.rain["1h"];
			} else weatherPrecipitation.innerHTML = "0";
		})
		.catch((err) => {
			console.error(err);

			weatherCity.innerHTML = "City not found";
		});
});

function displayTemp(temp) {
	return Math.round(temp);
}

function displayUNIXDate(unix) {
	const date = new Date(unix * 1000);
	return date.toLocaleDateString(undefined, {
		weekday: "long",
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "numeric",
	});
}

function displayUNIXTime(unix) {
	const time = new Date(unix * 1000);
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "numeric",
	}).format(time);
}
