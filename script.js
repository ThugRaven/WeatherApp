import Weather from './weather.js';
import * as constants from './constants.js';

const weather = new Weather('');

const mainContent = document.querySelector('.main');
const currentWeatherTemplate = document.getElementById(
	'current-weather__template',
);
const lastSearchedItemTemplate = document.getElementById(
	'last-searched-item__template',
);
const forecastItemTemplate = document.getElementById('forecast-item__template');
const locationInput = document.querySelector('[data-input]');
const locationInputDetails = document.querySelector('[data-input-details]');
const weatherButton = document.querySelector('[data-button]');
const weatherButtonDetails = document.querySelector('[data-button-details]');
const searchError = document.querySelector('.search-error');
const searchErrorDetails = document.querySelector('[data-search-error]');
const lastSearchedList = document.querySelector('.last-searched__list');
const normalLayout = document.querySelector('.normal-layout');
const fullLayout = document.querySelector('.full-layout');
const apiKeyInput = document.querySelector('[data-input-api]');

const LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY = 'weather.app.cities.weather.data';
let citiesWeatherData =
	JSON.parse(localStorage.getItem(LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY)) || [];

let currentSection;
let isFirstTime = false;
let backButton;

let refreshTimeout;
let globalWeatherData;

showLastSearched();

weatherButton.addEventListener('click', (event) => {
	event.preventDefault();
	const location = locationInput.value.trim().toLowerCase();
	if (location == null || location === '') return;

	if (apiKeyInput.value != null && apiKeyInput.value != '') {
		weather.setApiKey(apiKeyInput.value);
	}

	addCurrentWeatherSection(location);
	updateCurrentWeatherSection(location);
});

weatherButtonDetails.addEventListener('click', (event) => {
	event.preventDefault();
	const location = locationInputDetails.value.trim().toLowerCase();
	if (location == null || location === '') return;
	console.log(location);

	weather
		.getCurrentByCityName(location)
		.then((weatherData) => {
			console.log('Call API');
			searchErrorDetails.innerText = '';
			searchErrorDetails.dataset.hidden = true;

			console.log(weatherData);

			globalWeatherData = weatherData;
			callOneCall();
		})
		.catch((err) => {
			console.error(err);

			searchErrorDetails.dataset.hidden = false;
			if (err.message == 404) {
				searchErrorDetails.innerText = 'City not found!';
			} else {
				searchErrorDetails.innerText = 'Error occured!';
			}
		});
});

function addCurrentWeatherSection(location) {
	if (mainContent.querySelector('.section--current') == null) {
		currentSection = document.importNode(currentWeatherTemplate.content, true);
		isFirstTime = true;

		const moreInfoButton = currentSection.querySelector('.more-info');
		moreInfoButton.addEventListener('click', callOneCall);

		const refreshIcon = currentSection.querySelector('.refresh-icon');
		refreshIcon.addEventListener('click', () => {
			if (isUpdateAvailable(location)) {
				currentSection = document.querySelector('.section--current');
				isFirstTime = false;
				callCurrentWeather(location);
				console.log('Refresh Data');
			}
			setRefreshTimeout(location, refreshIcon);
		});
	} else {
		currentSection = document.querySelector('.section--current');
		isFirstTime = false;
	}

	const refreshIcon = currentSection.querySelector('.refresh-icon');
	setRefreshTimeout(location, refreshIcon);
}

function updateCurrentWeatherSection(location) {
	let cityData = checkCitiesWeatherData(location);
	if (cityData) {
		if (isUpdateAvailable(location)) {
			callCurrentWeather(location);
		} else {
			searchError.innerText = '';
			searchError.dataset.hidden = true;
			displayData(currentSection, cityData.weatherData);
			globalWeatherData = cityData.weatherData;

			console.log('No Data Update');

			let index = citiesWeatherData.findIndex((el) => el.city == location);
			if (index < 0) {
				index = citiesWeatherData.findIndex(
					(el) => el.weatherData.name == location,
				);
			}
			citiesWeatherData[index].lastUpdated = new Date();
			saveCitiesWeatherData();
			console.log('Update Date');
		}
	} else {
		callCurrentWeather(location);
	}
}

function callCurrentWeather(location) {
	weather
		.getCurrentByCityName(location)
		.then((weatherData) => {
			console.log('Call API');
			searchError.innerText = '';
			searchError.dataset.hidden = true;

			if (isUpdateAvailable(location)) {
				let index = citiesWeatherData.findIndex((el) => el.city == location);
				if (index < 0) {
					index = citiesWeatherData.findIndex(
						(el) => el.weatherData.name == location,
					);
				}
				citiesWeatherData[index] = {
					city: location,
					weatherData,
					lastUpdated: new Date(),
				};
				console.log('Update Location');
			} else {
				citiesWeatherData.push({
					city: location,
					weatherData,
					lastUpdated: new Date(),
				});
				console.log('Add First Time');
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
				mainContent.removeChild(currentSection);
			}

			searchError.dataset.hidden = false;
			if (err.message == 404) {
				searchError.innerText = 'City not found!';
			} else {
				searchError.innerText = 'Error occured!';
			}
		});
}

function displayData(container, weatherData) {
	document.title = `Weather App | ${weatherData.name}`;

	const weatherPrecipitation = container.querySelector('[data-precipitation]');

	container.querySelector(
		'[data-location]',
	).innerText = `${weatherData.name}, ${weatherData.sys.country}`;
	container.querySelector('[data-date]').innerText = displayUNIXDate(
		weatherData.dt,
	);
	container.querySelector('[data-temp]').innerText = displayTemp(
		weatherData.main.temp,
	);
	container.querySelector('[data-temp-feels]').innerText = displayTemp(
		weatherData.main.feels_like,
	);
	container.querySelector('[data-icon]').src = weather.getWeatherIcon(
		weatherData.weather[0].icon,
	);
	container.querySelector('[data-icon]').alt = weatherData.weather[0].main;
	container.querySelector('[data-icon]').title = weatherData.weather[0].main;
	container.querySelector('[data-main-desc]').innerText =
		weatherData.weather[0].main;
	container.querySelector('[data-second-desc]').innerText =
		weatherData.weather[0].description;
	container.querySelector('[data-pressure]').innerText =
		weatherData.main.pressure;
	container.querySelector('[data-visibility]').innerText =
		Math.round(weatherData.visibility / 100) / 10;
	container.querySelector('[data-humidity]').innerText =
		weatherData.main.humidity;
	container.querySelector('[data-sunrise]').innerText = displayUNIXTime(
		weatherData.sys.sunrise,
	);
	container.querySelector('[data-wind]').innerText = weatherData.wind.speed;
	container.querySelector('[data-sunset]').innerText = displayUNIXTime(
		weatherData.sys.sunset,
	);
	container.querySelector('[data-cloudiness]').innerText =
		weatherData.clouds.all;
	container.querySelector(
		'[data-wind-deg]',
	).innerText = `${weatherData.wind.deg}°`;
	container
		.querySelector('.wind-pointer')
		.style.setProperty('transform', `rotate(${weatherData.wind.deg}deg)`);
	if (weatherData.rain != null && weatherData.rain['1h'] != null) {
		weatherPrecipitation.innerText = weatherData.rain['1h'];
		weatherPrecipitation.title = `${weatherData.rain['1h']}mm/h of Rain`;
	} else if (weatherData.snow != null && weatherData.snow['1h'] != null) {
		weatherPrecipitation.innerText = weatherData.snow['1h'];
		weatherPrecipitation.title = `${weatherData.snow['1h']}mm/h of Snow`;
	} else {
		weatherPrecipitation.innerText = '0';
		weatherPrecipitation.title = '';
	}

	if (isFirstTime) {
		mainContent.appendChild(currentSection);
	}
}

function displayTemp(temp) {
	return Math.round(temp);
}

function displayUNIXDate(unix, options) {
	const date = new Date(unix * 1000);
	if (options) {
		return date.toLocaleDateString(undefined, options);
	} else
		return date.toLocaleDateString(undefined, {
			weekday: 'long',
			day: 'numeric',
			month: 'short',
			hour: 'numeric',
			minute: 'numeric',
		});
}

function displayShortDate(date) {
	const shortDate = new Date(date);
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(shortDate);
}

function displayUNIXTime(unix) {
	const time = new Date(unix * 1000);
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: 'numeric',
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

	// Check for same name in the weatherData.name to prevent duplication of same cities but with different languages

	// Useless?
	while (citiesWeatherData.length > 10) {
		console.log(citiesWeatherData);
		let min = new Date(citiesWeatherData[0].lastUpdated);
		let index = 0;
		for (let i = citiesWeatherData.length - 1; i > 0; i--) {
			if (new Date(citiesWeatherData[i].lastUpdated) < min) {
				min = new Date(citiesWeatherData[i].lastUpdated);
				index = i;
				console.log('min');
			}
			console.log(i);
		}
		console.log('Removed: ');
		console.log(citiesWeatherData[index]);
		citiesWeatherData.splice(index, 1);
		console.log(citiesWeatherData);
	}

	localStorage.setItem(
		LOCAL_STORAGE_CITIES_WEATHER_DATA_KEY,
		JSON.stringify(citiesWeatherData),
	);

	showLastSearched();
}

function showLastSearched() {
	lastSearchedList.innerText = '';

	citiesWeatherData.forEach((el) => {
		let item = document.importNode(lastSearchedItemTemplate.content, true);

		item.querySelector('[data-icon]').src = weather.getWeatherIcon(
			el.weatherData.weather[0].icon,
		);
		item.querySelector(
			'[data-icon]',
		).title = `${el.weatherData.weather[0].main}`;

		item.querySelector(
			'.last-searched__city',
		).innerText = `${el.weatherData.name}, ${el.weatherData.sys.country}`;
		item.querySelector('.last-searched__temp').innerText = displayTemp(
			el.weatherData.main.temp,
		);
		item.querySelector('.last-searched__date').innerText = displayShortDate(
			el.lastUpdated,
		);
		item.querySelector('.last-searched__item').addEventListener('click', () => {
			console.log(el.weatherData.name);
			let location = el.weatherData.name.toLowerCase();
			addCurrentWeatherSection(location);
			updateCurrentWeatherSection(location);
			locationInput.value = el.weatherData.name;
		});

		lastSearchedList.appendChild(item);
	});
}

function checkCitiesWeatherData(city) {
	let hasCityInput = citiesWeatherData.find((el) => el.city == city);
	let hasCityQuery = citiesWeatherData.find(
		(el) => el.weatherData.name == city,
	);

	if (hasCityInput) {
		console.log('hasInput');
		return hasCityInput;
	}
	if (hasCityQuery) {
		console.log('hasQuery');
		return hasCityQuery;
	}
	return false;
}

function isUpdateAvailable(location) {
	let cityData = checkCitiesWeatherData(location);
	let updateDate = new Date().setMinutes(
		new Date().getMinutes() - constants.UPDATE_TIME,
	);

	if (cityData && cityData.weatherData.dt * 1000 <= updateDate) {
		console.log('Update Available');
		return true;
	} else if (cityData) {
		console.log('Update Not Available');
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
			new Date() - cityData.weatherData.dt * 1000,
		);
		if (constants.REFRESH_TIMEOUT - timeDifference > 0) {
			timeout = constants.REFRESH_TIMEOUT - timeDifference;
		}
		console.log(
			`Timeout: ${
				Math.round((Math.round(timeout / 1000) / 60) * 100) / 100
			} min, ${timeout / 1000}s, ${timeout}ms`,
		);
	}

	refreshTimeout = setTimeout(() => {
		if (isUpdateAvailable(location)) {
			refreshIcon.dataset.hidden = false;
		}
		console.log('Ready to refresh!');
	}, timeout);
}

function callOneCall() {
	console.log('More Info');
	console.log(globalWeatherData);
	if (globalWeatherData) {
		console.log(
			`Lat: ${globalWeatherData.coord.lat}, Lon: ${globalWeatherData.coord.lon}`,
		);

		normalLayout.dataset.hidden = true;
		fullLayout.dataset.hidden = false;
		locationInputDetails.value = globalWeatherData.name;
		weather
			.getOneCallByLatLong(
				globalWeatherData.coord.lat,
				globalWeatherData.coord.lon,
			)
			.then((weatherData) => {
				console.log('Call One Call API');
				console.log(weatherData);

				if (refreshTimeout) clearTimeout(refreshTimeout);
				displayOneCallData(
					document.querySelector('.section--current-full'),
					weatherData.current,
				);
				displayDailyForecast(weatherData.daily);
				displayMinuteForecast(weatherData.minutely);

				if (!backButton) {
					backButton = document.querySelector('.back-btn');
					backButton.addEventListener('click', () => {
						normalLayout.dataset.hidden = false;
						fullLayout.dataset.hidden = true;
						locationInput.value = globalWeatherData.name;

						addCurrentWeatherSection(
							globalWeatherData.name.trim().toLowerCase(),
						);
						updateCurrentWeatherSection(
							globalWeatherData.name.trim().toLowerCase(),
						);
					});
				}
			})
			.catch((err) => {
				console.error(err);

				normalLayout.dataset.hidden = false;
				fullLayout.dataset.hidden = true;
				if (refreshTimeout) clearTimeout(refreshTimeout);
				if (err.message == 404) {
				} else {
				}
			});
	}
}

function displayOneCallData(container, weatherData) {
	document.title = `Weather App | ${globalWeatherData.name} Forecast`;

	const weatherPrecipitation = container.querySelector('[data-precipitation]');

	container.querySelector(
		'[data-location]',
	).innerText = `${globalWeatherData.name}, ${globalWeatherData.sys.country}`;
	container.querySelector('[data-date]').innerText = displayUNIXDate(
		weatherData.dt,
	);
	container.querySelector('[data-temp]').innerText = displayTemp(
		weatherData.temp,
	);
	container.querySelector('[data-temp-feels]').innerText = displayTemp(
		weatherData.feels_like,
	);
	container.querySelector('[data-icon]').src = weather.getWeatherIcon(
		weatherData.weather[0].icon,
	);
	container.querySelector('[data-icon]').alt = weatherData.weather[0].main;
	container.querySelector('[data-icon]').title = weatherData.weather[0].main;
	container.querySelector('[data-main-desc]').innerText =
		weatherData.weather[0].main;
	container.querySelector('[data-second-desc]').innerText =
		weatherData.weather[0].description;
	container.querySelector('[data-pressure]').innerText = weatherData.pressure;
	container.querySelector('[data-visibility]').innerText =
		Math.round(weatherData.visibility / 100) / 10;
	container.querySelector('[data-humidity]').innerText = weatherData.humidity;
	container.querySelector('[data-sunrise]').innerText = displayUNIXTime(
		weatherData.sunrise,
	);
	container.querySelector('[data-wind]').innerText = weatherData.wind_speed;
	container.querySelector('[data-sunset]').innerText = displayUNIXTime(
		weatherData.sunset,
	);
	container.querySelector('[data-cloudiness]').innerText = weatherData.clouds;
	container.querySelector(
		'[data-wind-deg]',
	).innerText = `${weatherData.wind_deg}°`;
	container
		.querySelector('.wind-pointer')
		.style.setProperty('transform', `rotate(${weatherData.wind_deg}deg)`);
	if (weatherData.rain != null && weatherData.rain['1h'] != null) {
		weatherPrecipitation.innerText = weatherData.rain['1h'];
		weatherPrecipitation.title = `${weatherData.rain['1h']}mm/h of Rain`;
	} else if (weatherData.snow != null && weatherData.snow['1h'] != null) {
		weatherPrecipitation.innerText = weatherData.snow['1h'];
		weatherPrecipitation.title = `${weatherData.snow['1h']}mm/h of Snow`;
	} else {
		weatherPrecipitation.innerText = '0';
		weatherPrecipitation.title = '';
	}
	container.querySelector('[data-dew-point]').innerText = displayTemp(
		weatherData.dew_point,
	);

	let compassSector = [
		'N',
		'NNE',
		'NE',
		'ENE',
		'E',
		'ESE',
		'SE',
		'SSE',
		'S',
		'SSW',
		'SW',
		'WSW',
		'W',
		'WNW',
		'NW',
		'NNW',
		'N',
	];
	container.querySelector('[data-direction]').innerText =
		compassSector[(weatherData.wind_deg / 22.5).toFixed(0)];
	container.querySelector('[data-uvi]').innerText = weatherData.uvi;
}

function displayDailyForecast(weatherData) {
	const forecastList = document.querySelector('.forecast__list');
	forecastList.innerText = '';
	let lastIndex = 0;

	weatherData.forEach((el, index) => {
		let item = document.importNode(forecastItemTemplate.content, true);

		item.querySelector('[data-date]').innerText = displayUNIXDate(el.dt, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
		item.querySelector('[data-icon]').src = weather.getWeatherIcon(
			el.weather[0].icon,
		);
		item.querySelector('[data-icon]').alt = el.weather[0].main;
		item.querySelector('[data-icon]').title = el.weather[0].main;

		item.querySelector('[data-main-desc]').innerText = el.weather[0].main;
		item.querySelector('[data-temp-day]').innerText = `${displayTemp(
			el.temp.day,
		)}°`;
		item.querySelector('[data-temp-night]').innerText = `${displayTemp(
			el.temp.night,
		)}°`;

		const itemElement = item.querySelector('[data-item]');

		if (index == 0) {
			itemElement.classList.add('forecast__item--active');
			displayDailyForecastDetails(weatherData[index]);
		}

		itemElement.addEventListener('click', () => {
			if (lastIndex == index) return;

			console.log(weatherData[index]);
			lastIndex = index;
			removeActiveClasses();
			itemElement.classList.add('forecast__item--active');
			if (index == 0) {
				document.querySelector('.minute__info').dataset.hidden = false;
			} else {
				document.querySelector('.minute__info').dataset.hidden = true;
			}
			displayDailyForecastDetails(weatherData[index]);
		});

		itemElement.style.setProperty('animation-delay', `${index * 25}ms`);

		forecastList.appendChild(item);
	});
}

function removeActiveClasses() {
	const forecastItems = document.querySelectorAll('[data-item]');
	forecastItems.forEach((el) => {
		if (el.classList.contains('forecast__item--active')) {
			el.classList.remove('forecast__item--active');
		}
	});
}

function displayDailyForecastDetails(weatherData) {
	const container = document.querySelector('.section--forecast-details');

	const weatherPrecipitation = container.querySelector('[data-precipitation]');

	container.querySelector(
		'[data-location]',
	).innerText = `${globalWeatherData.name}`;
	container.querySelector('[data-date]').innerText = displayUNIXDate(
		weatherData.dt,
		{
			dateStyle: 'full',
		},
	);
	container.querySelector('[data-temp]').innerText = displayTemp(
		weatherData.temp.day,
	);
	container.querySelector('[data-temp-feels]').innerText = displayTemp(
		weatherData.feels_like.day,
	);
	container.querySelector('[data-temp-max]').innerText = `${displayTemp(
		weatherData.temp.max,
	)}°`;
	container.querySelector('[data-temp-min]').innerText = `${displayTemp(
		weatherData.temp.min,
	)}°`;
	container.querySelector('[data-icon]').src = weather.getWeatherIcon(
		weatherData.weather[0].icon,
	);
	container.querySelector('[data-icon]').alt = weatherData.weather[0].main;
	container.querySelector('[data-icon]').title = weatherData.weather[0].main;
	container.querySelector('[data-main-desc]').innerText =
		weatherData.weather[0].main;
	container.querySelector('[data-second-desc]').innerText =
		weatherData.weather[0].description;
	container.querySelector('[data-pressure]').innerText = weatherData.pressure;
	container.querySelector('[data-wind]').innerText = weatherData.wind_speed;
	container.querySelector('[data-humidity]').innerText = weatherData.humidity;
	container.querySelector('[data-sunrise]').innerText = displayUNIXTime(
		weatherData.sunrise,
	);
	container.querySelector(
		'[data-wind-deg]',
	).innerText = `${weatherData.wind_deg}°`;
	container
		.querySelector('.wind-pointer')
		.style.setProperty('transform', `rotate(${weatherData.wind_deg}deg)`);
	container.querySelector('[data-sunset]').innerText = displayUNIXTime(
		weatherData.sunset,
	);
	container.querySelector('[data-cloudiness]').innerText = weatherData.clouds;
	let compassSector = [
		'N',
		'NNE',
		'NE',
		'ENE',
		'E',
		'ESE',
		'SE',
		'SSE',
		'S',
		'SSW',
		'SW',
		'WSW',
		'W',
		'WNW',
		'NW',
		'NNW',
		'N',
	];
	container.querySelector('[data-direction]').innerText =
		compassSector[(weatherData.wind_deg / 22.5).toFixed(0)];
	if (weatherData.rain != null) {
		weatherPrecipitation.innerText = weatherData.rain;
		weatherPrecipitation.title = `${weatherData.rain}mm of Rain`;
	} else if (weatherData.snow != null) {
		weatherPrecipitation.innerText = weatherData.snow;
		weatherPrecipitation.title = `${weatherData.snow}mm of Snow`;
	} else {
		weatherPrecipitation.innerText = '0';
		weatherPrecipitation.title = '';
	}
	container.querySelector('[data-dew-point]').innerText = displayTemp(
		weatherData.dew_point,
	);
	container.querySelector('[data-uvi]').innerText = weatherData.uvi;
	container.querySelector('[data-pop]').innerText = (
		weatherData.pop * 100
	).toFixed(0);
	container.querySelector('[data-moonrise]').innerText = displayUNIXTime(
		weatherData.moonrise,
	);
	container.querySelector('[data-moon-phase]').innerText =
		weatherData.moon_phase;
	container.querySelector('[data-moon-phase]').title = `${
		weatherData.moon_phase
	} - ${getMoonPhase(weatherData.moon_phase)}`;
	container.querySelector('[data-moonset]').innerText = displayUNIXTime(
		weatherData.moonset,
	);
}

function getMoonPhase(phase) {
	if (phase == 0 || phase == 1) {
		return 'New Moon';
	} else if (phase > 0 && phase < 0.25) {
		return 'Waxing Crescent';
	} else if (phase == 0.25) {
		return 'First Quarter';
	} else if (phase > 0.25 && phase < 0.5) {
		return 'Waxing Gibous';
	} else if (phase == 0.5) {
		return 'Full Moon';
	} else if (phase > 0.5 && phase < 0.75) {
		return 'Waning Gibbous';
	} else if (phase == 0.75) {
		return 'Last Quarter';
	} else if (phase > 0.75 && phase < 1) {
		return 'Waning Crescent';
	}
}

function displayMinuteForecast(weatherData) {
	const minuteList = document.querySelector('.minute__list');
	const minuteTimeList = document.querySelector('.minute-time__list');

	minuteList.innerText = '';
	minuteTimeList.innerText = '';

	let maxHeight = 0;
	for (let i = 0; i < weatherData.length; i++) {
		if (maxHeight < weatherData[i].precipitation) {
			maxHeight = weatherData[i].precipitation;
		}
	}

	displayPrecipitationMsg(weatherData);

	weatherData.forEach((el, index) => {
		let item = document.createElement('li');
		let time = document.createElement('li');

		item.title = `${displayUNIXTime(el.dt)} - ${el.precipitation}mm/h`;
		item.dataset.precipitation = `${displayUNIXTime(
			el.dt,
		)} ${el.precipitation.toFixed(2)}`;
		if (maxHeight != 0) {
			item.style.height = `${(el.precipitation / maxHeight) * 100}%`;
		}

		if (index % 10 == 0) {
			time.innerText = `${displayUNIXTime(el.dt)}`;
		}

		minuteList.appendChild(item);
		minuteTimeList.appendChild(time);
	});

	// let precipitationData = [];
	// let labels = [];

	// weatherData.forEach((el) => {
	// 	precipitationData.push(el.precipitation);
	// 	labels.push(displayUNIXTime(el.dt));
	// });

	// console.log(weatherData);

	// const myChart = new Chart(document.getElementById("myChart"), {
	// 	type: "bar",
	// 	responsive: true,
	// 	data: {
	// 		labels: labels,
	// 		datasets: [
	// 			{
	// 				label: "Precipitation volume",
	// 				data: precipitationData,
	// 				backgroundColor: "#1e3559",
	// 				borderColor: "#8ab4f8",
	// 				borderWidth: {
	// 					top: 2,
	// 					right: 0,
	// 					bottom: 0,
	// 					left: 0,
	// 				},
	// 				barThickness: "flex",
	// 				categoryPercentage: 1.0,
	// 				barPercentage: 1.0,
	// 			},
	// 		],
	// 	},
	// 	options: {
	// 		scales: {
	// 			y: {
	// 				beginAtZero: true,
	// 			},
	// 		},
	// 	},
	// });
}

function displayPrecipitationMsg(weatherData) {
	const minutePrecipitationMsg = document.querySelector(
		'.minute__precipitation-msg',
	);

	let precipitationStart = null;
	let precipitationEnd = null;
	let precipitationStartIndex = 0;
	let precipitationEndIndex = 0;

	for (let i = 0; i < weatherData.length; i++) {
		if (!precipitationStart && weatherData[i].precipitation > 0) {
			precipitationStart = weatherData[i].dt;
			precipitationStartIndex = i;
		} else if (precipitationStart && weatherData[i].precipitation > 0) {
			precipitationEnd = weatherData[i].dt;
			precipitationEndIndex = i;
			if (
				i < weatherData.length - 1 &&
				weatherData[i + 1].precipitation === 0
			) {
				break;
			}
		}
	}

	if (!precipitationStart) {
		minutePrecipitationMsg.innerText = 'No precipitation within an hour';
	} else if (precipitationStartIndex === 0 && precipitationEndIndex === 60) {
		minutePrecipitationMsg.innerText = "Precipitation won't end within an hour";
	} else if (precipitationStartIndex > 0) {
		let difference =
			(new Date(precipitationStart) - new Date(weatherData[0].dt)) / 60;
		minutePrecipitationMsg.innerText = `Precipitation will start within ${difference} ${
			difference === 1 ? 'minute' : 'minutes'
		} (${displayUNIXTime(precipitationStart)})`;
	} else if (precipitationEnd) {
		let difference =
			(new Date(precipitationEnd) - new Date(weatherData[0].dt)) / 60;
		minutePrecipitationMsg.innerText = `Precipitation will end within ${difference} ${
			difference === 1 ? 'minute' : 'minutes'
		} (${displayUNIXTime(precipitationEnd)})`;
	}
}
