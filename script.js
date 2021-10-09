import { API_KEY } from "./settings.js";
import Weather from "./weather.js";
import * as constants from "./constants.js";

const weather = new Weather(API_KEY);
// weather.setUnits("standard");

const currentWeatherTemplate = document.getElementById(
	"current-weather__template"
);
const lastSearchedItemTemplate = document.getElementById(
	"last-searched-item__template"
);
const locationInput = document.querySelector("[data-input]");
const weatherButton = document.querySelector("[data-button]");
const searchError = document.querySelector(".search-error");
const lastSearchedList = document.querySelector(".last-searched__list");

const LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY = "weather.app.cities.weather.data";
let citiesWeatherData =
	JSON.parse(localStorage.getItem(LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY)) || [];

history.replaceState("", null, "");

window.addEventListener("popstate", (event) => {
	console.log(
		"location: " + document.location + ", state: " + JSON.stringify(event.state)
	);
});

let currentSection;
let isFirstTime = false;

let refreshTimeout;
let globalWeatherData;

showLastSearched();

weatherButton.addEventListener("click", (event) => {
	event.preventDefault();
	const location = locationInput.value.trim().toLowerCase();
	if (location == null || location === "") return;

	let cityData = checkCitiesWeatherData(location);

	if (document.body.querySelector(".section--current") == null) {
		currentSection = document.importNode(currentWeatherTemplate.content, true);
		isFirstTime = true;

		const moreInfoButton = currentSection.querySelector(".more-info");
		moreInfoButton.addEventListener("click", callOneCall);

		const refreshIcon = currentSection.querySelector(".refresh-icon");
		refreshIcon.addEventListener("click", () => {
			if (isUpdateAvailable(location)) {
				currentSection = document.querySelector(".section--current");
				isFirstTime = false;
				callCurrentWeather(location);
				console.log("Refresh Data");
			}
			setRefreshTimeout(location, refreshIcon);
		});
	} else {
		currentSection = document.querySelector(".section--current");
		isFirstTime = false;
	}

	const refreshIcon = currentSection.querySelector(".refresh-icon");
	setRefreshTimeout(location, refreshIcon);

	if (cityData) {
		if (isUpdateAvailable(location)) {
			callCurrentWeather(location);
		} else {
			searchError.innerHTML = "";
			searchError.dataset.hidden = true;
			displayData(currentSection, cityData.weatherData);
			globalWeatherData = cityData.weatherData;

			console.log("No Update");
		}
	} else {
		callCurrentWeather(location);
	}
});

function callCurrentWeather(location) {
	weather
		.getCurrentByCityName(location)
		.then((weatherData) => {
			console.log("Call API");
			searchError.innerHTML = "";
			searchError.dataset.hidden = true;

			history.pushState({ city: location }, "city", `?city=${location}`);

			if (isUpdateAvailable(location)) {
				let index = citiesWeatherData.findIndex((el) => el.city == location);
				if (index < 0) {
					index = citiesWeatherData.findIndex(
						(el) => el.weatherData.name == location
					);
				}
				citiesWeatherData[index] = {
					city: location,
					weatherData,
					lastUpdated: new Date(),
				};
				console.log("Update Location");
			} else {
				citiesWeatherData.push({
					city: location,
					weatherData,
					lastUpdated: new Date(),
				});
				console.log("Add First Time");
			}

			saveCitiesWeatherData();
			displayData(currentSection, weatherData);

			console.log(weatherData);
			globalWeatherData = weatherData;
		})
		.catch((err) => {
			console.error(err);

			if (refreshTimeout) clearTimeout(refreshTimeout);
			if (!isFirstTime) {
				document.body.removeChild(currentSection);
			}

			searchError.dataset.hidden = false;
			if (err.message == 404) {
				searchError.innerHTML = "City not found!";
			} else {
				searchError.innerHTML = "Error occured!";
			}
		});
}

function displayData(container, weatherData) {
	document.title = `Weather App | ${weatherData.name}`;

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

	if (isFirstTime) {
		document.body.appendChild(currentSection);
	}
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

function displayShortDate(date) {
	const shortDate = new Date(date);
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "short",
		timeStyle: "short",
	}).format(shortDate);
}

function displayUNIXTime(unix) {
	const time = new Date(unix * 1000);
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "numeric",
	}).format(time);
}

function saveCitiesWeatherData() {
	citiesWeatherData.sort((a, b) => {
		let firstDate = new Date(a.lastUpdated);
		let secondDate = new Date(b.lastUpdated);

		if (secondDate < firstDate) return -1;
		if (secondDate > firstDate) return 1;
		return 0;
	});

	// Useless?
	while (citiesWeatherData.length > 10) {
		console.log(citiesWeatherData);
		let min = new Date(citiesWeatherData[0].lastUpdated);
		let index = 0;
		for (let i = citiesWeatherData.length - 1; i > 0; i--) {
			if (new Date(citiesWeatherData[i].lastUpdated) < min) {
				min = new Date(citiesWeatherData[i].lastUpdated);
				index = i;
				console.log("min");
			}
			console.log(i);
		}
		console.log("Removed: ");
		console.log(citiesWeatherData[index]);
		citiesWeatherData.splice(index, 1);
		console.log(citiesWeatherData);
	}

	localStorage.setItem(
		LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY,
		JSON.stringify(citiesWeatherData)
	);

	showLastSearched();
}

function showLastSearched() {
	lastSearchedList.innerHTML = "";

	citiesWeatherData.forEach((el) => {
		let item = document.importNode(lastSearchedItemTemplate.content, true);

		item.querySelector("[data-icon]").src = weather.getWeatherIcon(
			el.weatherData.weather[0].icon
		);
		item.querySelector(".last-searched__city").innerHTML = el.weatherData.name;
		item.querySelector(".last-searched__temp").innerHTML = displayTemp(
			el.weatherData.main.temp
		);
		item.querySelector(".last-searched__date").innerHTML = displayShortDate(
			el.lastUpdated
		);

		lastSearchedList.appendChild(item);
	});
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

function isUpdateAvailable(location) {
	let cityData = checkCitiesWeatherData(location);
	let updateDate = new Date().setMinutes(
		new Date().getMinutes() - constants.UPDATE_TIME
	);

	if (cityData && cityData.weatherData.dt * 1000 <= updateDate) {
		console.log("Update Available");
		return true;
	} else if (cityData) {
		console.log("Update Not Available");
		return false;
	}
}

function setRefreshTimeout(location, refreshIcon) {
	refreshIcon.dataset.hidden = true;
	let cityData = checkCitiesWeatherData(location);
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
		if (isUpdateAvailable(location)) {
			refreshIcon.dataset.hidden = false;
		}
		console.log("Ready to refresh!");
	}, timeout);
}

function callOneCall() {
	console.log("More Info");
	console.log(globalWeatherData);
	if (globalWeatherData) {
		console.log(
			`Lat: ${globalWeatherData.coord.lat}, Lon: ${globalWeatherData.coord.lon}`
		);

		weather
			.getOneCallByLatLong(
				globalWeatherData.coord.lat,
				globalWeatherData.coord.lon
			)
			.then((weatherData) => {
				console.log("Call One Call API");
				console.log(weatherData);
			})
			.catch((err) => {
				console.error(err);

				if (err.message == 404) {
				} else {
				}
			});
	}
}
