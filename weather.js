export default class Weather {
	UNITS = "metric";
	LANGUAGE = "en";

	constructor(apiKey) {
		this.API_KEY = apiKey;
	}

	setUnits(unit) {
		this.UNITS = unit;
	}

	getUnits() {
		return this.UNITS;
	}

	setLanguage(language) {
		this.LANGUAGE = language;
	}

	getLanguage() {
		return this.LANGUAGE;
	}

	prepareURLFetch(url) {
		if (this.UNITS) {
			url += `&units=${this.UNITS}`;
		}

		if (this.LANGUAGE) {
			url += `&lang=${this.LANGUAGE}`;
		}

		return fetch(url).then((res) => {
			if (res.ok) {
				return res.json();
			} else {
				throw new Error(res.status);
			}
		});
	}

	getCurrentByCityName(cityName) {
		let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(
			cityName
		)}&appid=${this.API_KEY}`;

		return this.prepareURLFetch(url);
	}

	getCurrentByCityID(cityID) {
		let url = `https://api.openweathermap.org/data/2.5/weather?id=${encodeURI(
			cityID
		)}&appid=${this.API_KEY}`;

		return this.prepareURLFetch(url);
	}

	getCurrentByLatLong(lat, long) {
		let url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURI(
			lat
		)}&lon=${encodeURI(long)}&appid=${this.API_KEY}`;

		return this.prepareURLFetch(url);
	}

	celsiusToFahrenheit(temp) {
		return temp * (9 / 5) + 32;
	}

	getWeatherIcon(id) {
		let url = `https://openweathermap.org/img/wn/${id}@2x.png`;
		return url;
	}
}
