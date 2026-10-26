$(function () {
    let currentRequest = null;
    let searchId = 0;

    // Sök efter en stad med Enter.
    $("#search-form").on("submit", function (event) {
        event.preventDefault();

        const city = $("#city-input").val().trim();

        if (!city) {
            $("#status-message").text("Please enter a city.");
            return;
        }

        const id = startSearch("Loading weather...");
        fetchWeather({ q: city }, id);
    });

    // Förbered en ny sökning.
    function startSearch(message) {
        searchId += 1;

        if (currentRequest) {
            currentRequest.abort();
            currentRequest = null;
        }

        $("#weather-result").prop("hidden", true);
        $("#status-message").text(message);

        return searchId;
    }

    // Hämta väder från OpenWeather.
    function fetchWeather(location, id) {
        currentRequest = $.ajax({
            url: "https://api.openweathermap.org/data/2.5/weather",
            method: "GET",
            dataType: "json",
            timeout: 10000,
            data: {
                ...location,
                appid: WEATHER_API_KEY,
                units: "metric"
            }
        })
            .done(function (data) {
                if (id !== searchId) {
                    return;
                }

                showWeather(data);
                $("#status-message").text("");
            })
            .fail(function (xhr, textStatus) {
                if (textStatus === "abort" || id !== searchId) {
                    return;
                }

                let message = "Could not fetch weather. Please try again.";

                if (xhr.status === 404) {
                    message = "City not found. Please try another city.";
                } else if (xhr.status === 401) {
                    message = "API key not accepted. Check your API key.";
                } else if (textStatus === "timeout") {
                    message = "The request timed out. Please try again.";
                }

                $("#status-message").text(message);
            })
            .always(function () {
                if (id === searchId) {
                    currentRequest = null;
                }
            });
    }

    // Visa väderinformationen.
    function showWeather(data) {
        const weather = data.weather[0];

        $("#weather-city").text(data.name);

        $("#weather-icon").attr({
            src: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
            alt: weather.description
        });

        $("#weather-temperature").text(data.main.temp);
        $("#weather-wind").text(data.wind.speed);

        $("#weather-result").prop("hidden", false);
    }
});