export const displayMap = function (locations, maptilerKey) {
    const centerCoord = [
        locations[0].coordinates[1],
        locations[0].coordinates[0],
    ];
    const map = L.map("map", {
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
    }).setView(centerCoord, 13);
    L.tileLayer(
        `https://api.maptiler.com/maps/ch-swisstopo-lbm/{z}/{x}/{y}.jpg?key=${maptilerKey}`,
        {
            attribution:
                '&copy; <a href="http://www.maptiler.com">Maptiler</a>',
        }
    ).addTo(map);

    const myIcon = L.icon({
        iconUrl: "/img/pin.png",
        iconSize: [25, 33],
        iconAnchor: [10, 30],
        popupAnchor: [2, -20],
    });

    let myLatLng = [];
    locations.forEach((loc) => {
        const coords = [loc.coordinates[1], loc.coordinates[0]];
        myLatLng.push(coords);

        L.marker(coords, { icon: myIcon })
            .addTo(map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `leafletmap-popup leafletmap-popup-content`,
                })
            )
            .setPopupContent(`Day ${loc.day}: ${loc.description}`)
            .openPopup();
        // map.setView([locations[1].coordinates[1], locations[1].coordinates[0]], 9)
    });

    let bounds = L.latLngBounds(myLatLng);
    map.fitBounds(bounds, {
        paddingTopLeft: [200, 50],
    });
};
