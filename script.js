import { API_KEY } from "./settings.js";
import Weather from "./weather.js";
import * as constants from "./constants.js";

const weather = new Weather(API_KEY);
// weather.setUnits("standard");

const currentWeatherTemplate = document.getElementById(
	"current-weather__template"
);
const locationInput = document.querySelector("[data-input]");
const weatherButton = document.querySelector("[data-button]");
const searchError = document.querySelector(".search-error");

const LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY = "weather.app.cities.weather.data";
let citiesWeatherData =
	JSON.parse(localStorage.getItem(LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY)) || [];

history.replaceState("", null, "");

window.addEventListener("popstate", (event) => {
	console.log(
		"location: " + document.location + ", state: " + JSON.stringify(event.state)
	);
});

let refreshTimeout;

weatherButton.addEventListener("click", (event) => {
	event.preventDefault();
	const location = locationInput.value.trim();
	if (location == null || location === "") return;

	let currentSection;
	let isAdded = false;

	let cityData = checkCitiesWeatherData(location);
	let updateDate = new Date().setMinutes(new Date().getMinutes() - 10);
	let updateWeather = false;

	if (document.body.querySelector(".section--current") == null) {
		currentSection = document.importNode(currentWeatherTemplate.content, true);
		isAdded = true;

		const refreshData = currentSection.querySelector(".refresh-icon");
		refreshData.addEventListener("click", () => {
			// Check if data is ready to be refreshed/updated and then call the api
			console.log("Refresh Data");
		});

		if (refreshTimeout) clearTimeout(refreshTimeout);
		let timeout = constants.REFRESH_TIMEOUT;

		if (cityData) {
			let timeDifference = Math.round(
				new Date() - cityData.weatherData.dt * 1000
			);
			if (constants.REFRESH_TIMEOUT - timeDifference > 0) {
				timeout = constants.REFRESH_TIMEOUT - timeDifference;
			}
			console.log(
				`Timeout: ${
					Math.round((Math.round(timeout / 1000) / 60) * 100) / 100
				} min, ${timeout / 1000}s, ${timeout}ms`
			);
		}

		refreshTimeout = setTimeout(() => {
			console.log("Ready to refresh!");
		}, timeout);
	} else {
		currentSection = document.querySelector(".section--current");
	}

	// console.log(new Date(cityData.weatherData.dt * 1000));
	// console.log(new Date(updateDate));
	// console.log(cityData.weatherData.dt * 1000 < updateDate);
	if (cityData && cityData.weatherData.dt * 1000 <= updateDate) {
		updateWeather = true;
	} else if (cityData) {
		searchError.innerHTML = "";
		searchError.dataset.hidden = true;
		displayData(currentSection, cityData.weatherData);

		console.log("Display Last");
		console.log(cityData);

		if (isAdded) {
			document.body.appendChild(currentSection);
		}
		return;
	}

	weather
		.getCurrentByCityName(location)
		.then((weatherData) => {
			console.log("Call API");
			searchError.innerHTML = "";
			searchError.dataset.hidden = true;

			history.pushState({ city: location }, "city", `?city=${location}`);

			if (updateWeather) {
				let index = citiesWeatherData.findIndex((el) => el.city == location);
				citiesWeatherData[index] = { city: location, weatherData };
				console.log("Update Location");
			} else {
				citiesWeatherData.push({ city: location, weatherData });
				console.log("Add First Time");
			}

			saveCitiesWeatherData();
			displayData(currentSection, weatherData);

			console.log(weatherData);

			if (isAdded) {
				document.body.appendChild(currentSection);
			}
		})
		.catch((err) => {
			console.error(err);

			if (!isAdded) {
				document.body.removeChild(currentSection);
			}

			searchError.dataset.hidden = false;
			if (err.message == 404) {
				searchError.innerHTML = "City not found!";
			} else {
				searchError.innerHTML = "Error occured!";
			}
		});
});

function displayData(container, weatherData) {
	const weatherCity = container.querySelector(".current__location-name");
	const weatherDate = container.querySelector(".current__date");
	const weatherTemp = container.querySelector(".temp__value");
	const weatherFeelsTemp = container.querySelector(".temp__feels-value");
	const weatherIcon = container.querySelector("[data-icon]");
	const weatherMainDesc = container.querySelector(".current__main-desc");
	const weatherSecondDesc = container.querySelector(".current__second-desc");
	const weatherPressure = container.querySelector("[data-pressure]");
	const weatherVisibility = container.querySelector("[data-visibility]");
	const weatherHumidity = container.querySelector("[data-humidity]");
	const weatherSunrise = container.querySelector("[data-sunrise]");
	const weatherWind = container.querySelector("[data-wind]");
	const weatherSunset = container.querySelector("[data-sunset]");
	const weatherCloudiness = container.querySelector("[data-cloudiness]");
	const weatherWindDirection = container.querySelector("[data-wind-deg]");
	const weatherWindPointer = container.querySelector(".wind-pointer");
	const weatherPrecipitation = container.querySelector("[data-precipitation]");

	weatherCity.innerHTML = `${weatherData.name}, ${weatherData.sys.country}`;
	weatherDate.innerHTML = displayUNIXDate(weatherData.dt);
	weatherTemp.innerHTML = displayTemp(weatherData.main.temp);
	weatherFeelsTemp.innerHTML = displayTemp(weatherData.main.feels_like);
	weatherIcon.src = weather.getWeatherIcon(weatherData.weather[0].icon);
	weatherMainDesc.innerHTML = weatherData.weather[0].main;
	weatherSecondDesc.innerHTML = weatherData.weather[0].description;
	weatherPressure.innerHTML = weatherData.main.pressure;
	weatherVisibility.innerHTML = Math.round(weatherData.visibility / 100) / 10;
	weatherHumidity.innerHTML = weatherData.main.humidity;
	weatherSunrise.innerHTML = displayUNIXTime(weatherData.sys.sunrise);
	weatherWind.innerHTML = weatherData.wind.speed;
	weatherSunset.innerHTML = displayUNIXTime(weatherData.sys.sunset);
	weatherCloudiness.innerHTML = weatherData.clouds.all;
	weatherWindDirection.innerHTML = `${weatherData.wind.deg}&deg;`;
	weatherWindPointer.style.setProperty(
		"transform",
		`rotate(${weatherData.wind.deg}deg)`
	);
	if (weatherData.rain != null && weatherData.rain["1h"] != null) {
		weatherPrecipitation.innerHTML = weatherData.rain["1h"];
	} else weatherPrecipitation.innerHTML = "0";
}

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

function saveCitiesWeatherData() {
	localStorage.setItem(
		LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY,
		JSON.stringify(citiesWeatherData)
	);
}

function checkCitiesWeatherData(city) {
	let hasCityInput = citiesWeatherData.find((el) => el.city == city);
	let hasCityQuery = citiesWeatherData.find(
		(el) => el.weatherData.name == city
	);

	if (hasCityInput) {
		console.log("hasInput");
		return hasCityInput;
	}
	if (hasCityQuery) {
		console.log("hasQuery");
		return hasCityQuery;
	}
	return false;
}
