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

	getCurrentWeather(cityName) {
		let url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${this.API_KEY}`;

		if (this.UNITS) {
			url += `&units=${this.UNITS}`;
		}

		if (this.LANGUAGE) {
			url += `&lang=${this.LANGUAGE}`;
		}

		return fetch(url)
			.then((res) => res.json())
			.then((data) => {
				return data;
			});
	}
}
