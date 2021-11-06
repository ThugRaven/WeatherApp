const LOCAL_STORAGE_LIGHT_MODE_KEY = "weather.app.lightMode";

const themeToggle = document.querySelectorAll("[data-theme-toggle]");
let lightMode = localStorage.getItem(LOCAL_STORAGE_LIGHT_MODE_KEY);

function enableLightMode() {
	document.body.classList.add("light-mode");
	localStorage.setItem(LOCAL_STORAGE_LIGHT_MODE_KEY, "true");
}

function disableLightMode() {
	document.body.classList.remove("light-mode");
	localStorage.setItem(LOCAL_STORAGE_LIGHT_MODE_KEY, null);
}

if (lightMode === "true") {
	enableLightMode();
}

themeToggle.forEach((el) => {
	el.addEventListener("click", () => {
		lightMode = localStorage.getItem(LOCAL_STORAGE_LIGHT_MODE_KEY);
		if (lightMode !== "true") {
			enableLightMode();
		} else {
			disableLightMode();
		}
	});
});
