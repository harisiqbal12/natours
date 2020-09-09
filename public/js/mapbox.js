/* eslint-disable */

export const displayMap = locations => {

    mapboxgl.accessToken =
        'pk.eyJ1IjoiaGFycmlzMDc0IiwiYSI6ImNrZW40MTZ5bTB4NnoyeW1xeWNzaXJ3N2YifQ.GVHS2OO-KlZBAY6fTV3CDA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/harris074/cken8fudi21lg19rc342g66j4',
        scrollZoom: false,
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup

        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}</p>`)
            .addTo(map);

        // Extends The map bounds to include the current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 100,
            left: 100,
            right: 100,
        },
    });
};
