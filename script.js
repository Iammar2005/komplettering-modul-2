$(function () {
    let currentRequest = null;
    let searchId = 0;

    const cityPopover = new bootstrap.Popover($("#city-input")[0], {
        content: "We couldn't find the city, try again!",
        placement: "bottom",
        trigger: "manual",
        container: "body",
        customClass: "city-error-popover",
        animation: false
    });
    
    // Dölj felet när användaren skriver eller lämnar fältet.
    $("#city-input").on("input blur", function () {
        cityPopover.hide();
        $(this).removeAttr("aria-invalid");
    });

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

    // Hämta användarens position när platsknappen klickas.
    $("#location-button").on("click", function () {
        const id = startSearch("Finding your location...");

        if (!navigator.geolocation) {
            $("#status-message").text(
                "Your browser does not support geolocation."
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (position) {
                // Ignorera svaret om en ny sökning har påbörjats.
                if (id !== searchId) {
                    return;
                }

                $("#status-message").text("Loading weather...");

                fetchWeather({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                }, id);
            },
            function (error) {
                if (id !== searchId) {
                    return;
                }

                let message = "Could not find your location.";

                if (error.code === 1) {
                    message = "Location access denied. Allow access or search for a city.";
                } else if (error.code === 2) {
                    message = "Your location is currently unavailable.";
                } else if (error.code === 3) {
                    message = "Finding your location timed out. Please try again.";
                }

                $("#status-message").text(message);
            },
            {
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });

    // Förbered en ny sökning.
    function startSearch(message) {
        cityPopover.hide();
        $("#city-input").removeAttr("aria-invalid");

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
            
                if (xhr.status === 404) {
                    $("#status-message").text("");
                    $("#city-input")
                        .attr("aria-invalid", "true")
                        .trigger("focus");
            
                    cityPopover.show();
                    return;
                }
            
                let message = "Could not fetch weather. Please try again.";
            
                if (xhr.status === 401) {
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