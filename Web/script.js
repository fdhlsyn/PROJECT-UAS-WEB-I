document.addEventListener('DOMContentLoaded', function() {

    // --- Tambahan untuk Fitur Cuaca ---
    const OPENWEATHER_API_KEY = '0c53d5f171f4872ff81c812b1f6bb344'; // Ganti dengan API Key OpenWeatherMap Anda!
    // Biasanya butuh beberapa menit agar API key baru aktif.

    async function fetchWeather(lat, lon) {
        // Menggunakan bahasa 'id' (Indonesia) secara default untuk deskripsi cuaca
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=id`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                // Lebih detail di konsol untuk debugging
                console.error(`OpenWeatherMap API Error: ${response.status} - ${errorData.message}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching weather data:", error);
            return null;
        }
    }
    // --- Akhir Tambahan Cuaca ---


    // 1. Inisialisasi Peta (Fokus ke Indonesia)
    var mymap = L.map('mapid', {
        zoomControl: false // Sembunyikan kontrol zoom default untuk custom control
    }).setView([-2.5, 118.0], 5); // Koordinat tengah Indonesia, Zoom Level 5

     // Tambahkan kontrol geolokasi (posisi pengguna saat ini)
    L.control.locate({
        setView: 'once', // Peta akan zoom ke lokasi sekali
        strings: {
            title: "Tampilkan Lokasi Saya",
            popup: "Anda berada di sini"
        },
        locateOptions: {
            maxZoom: 16, // Zoom level saat menampilkan lokasi
            enableHighAccuracy: true // Akurasi tinggi (bisa lebih boros baterai)
        },
        drawCircle: true, // Gambarkan lingkaran akurasi
        markerStyle: { // Gaya marker posisi
            fillColor: '#28a745',
            color: '#28a745'
        },
        circleStyle: { // Gaya lingkaran akurasi
            color: '#28a745',
            fillColor: '#28a745'
        },
        onLocationError: function(err) {
            alert(err.message); // Tampilkan pesan error jika geolokasi gagal
        }
    }).addTo(mymap);

    // Tambahkan kontrol zoom kustom di pojok kanan atas
    L.control.zoom({ position: 'topright' }).addTo(mymap);

    // 2. Tambahkan Tile Layer (Peta Dasar)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 4 // Sesuaikan min zoom agar selalu terlihat Indonesia
    }).addTo(mymap);

    // Animasi Fade-in Peta setelah dimuat
    mymap.on('load', function() {
        document.getElementById('mapid').classList.add('map-fade-in');
    });

    // 3. Data Destinasi di Indonesia
    var visitedPlaces = [
        {
            name: "Danau Toba, Sumatera Utara",
            coords: [2.6841, 98.6792],
            description: "Danau vulkanik terbesar di dunia, dengan Pulau Samosir di tengahnya. Pemandangan super indah!",
            date: "10 Januari 2023",
            icon: 'fa-water',
            images: ['toba1.jpg', 'toba2.jpg'] // Memperbaiki jalur gambar
        },
        {
            name: "Borobudur, Jawa Tengah",
            coords: [-7.6075, 110.2038],
            description: "Candi Buddha terbesar di dunia, warisan budaya yang megah. Jangan lewatkan sunrise di sini!",
            date: "20 Februari 2023",
            icon: 'fa-monument',
            images: ['br1.jpg', 'br2.jpg'] // Memperbaiki jalur gambar
        },
        {
            name: "Pulau Komodo, NTT",
            coords: [-8.5630, 119.5348],
            description: "Rumah bagi Komodo, kadal terbesar di dunia. Surga bawah laut dan Pink Beach yang menakjubkan.",
            date: "15 Maret 2023",
            icon: 'fa-dragon',
            images: ['Kom1.jpg', 'Kom2.jpg'] // Memperbaiki jalur gambar (Komodo2.jpg, bukan kom2.jpg)
        },
        {
            name: "Raja Ampat, Papua Barat Daya",
            coords: [-0.4907, 130.8252],
            description: "Surga dunia bawah laut, keanekaragaman hayati lautnya tak tertandingi. Pengalaman diving tak terlupakan.",
            date: "05 April 2023",
            icon: 'fa-fish',
            images: ['rj1.jpeg', 'rj2.jpeg'] // Memperbaiki jalur gambar (rj1.jpeg/rj2.jpeg menjadi rj1.jpg/rj2.jpg)
        },
        {
            name: "Bromo, Jawa Timur",
            coords: [-7.9425, 112.9535],
            description: "Gunung berapi aktif dengan pemandangan sunrise yang spektakuler. Lautan pasir dan kawah yang eksotis.",
            date: "28 Mei 2023",
            icon: 'fa-mountain',
            images: ['bro1.jpeg', 'bro2.jpeg'] // Memperbaiki jalur gambar (bro1.jpeg/bro2.jpeg menjadi br1.jpg/br2.jpg)
        },
        {
            name: "Gunung Gede, Jawa Barat",
            coords: [-6.7828, 106.9806], // Koordinat perkiraan puncak Gunung Gede
            description: "Salah satu gunung favorit pendaki di Jawa Barat. Pemandangan kawah aktif dan edelweis abadi.",
            date: "11 Juni 2025", // Sesuaikan tanggal
            icon: 'fa-mountain', // Anda bisa memilih ikon yang relevan
            images: ['gede1.jpg','gede2.jpg'] // Tambahkan path gambar jika Anda memiliki gambar Gunung Gede, contoh: ['gede1.jpg', 'gede2.jpg']
        },
    ];

    var markers = []; // Array untuk menyimpan semua marker
    var routePolyline; // Variabel untuk menyimpan polyline rute

    // Fungsi untuk membuat Carousel HTML untuk Popup
    function createCarouselHtml(images) {
        if (!images || images.length === 0) return '';
        let indicators = '';
        let items = '';
        images.forEach((img, index) => {
            indicators += `<button type="button" data-bs-target="#popupCarousel" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''}" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>`;
            items += `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100" alt="Destinasi">
                </div>
            `;
        });
        return `
            <div id="popupCarousel" class="carousel slide popup-carousel" data-bs-ride="carousel">
                <div class="carousel-inner">
                    ${items}
                </div>
                ${images.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#popupCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#popupCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
                ` : ''}
                <div class="carousel-indicators">
                    ${indicators}
                </div>
            </div>
        `;
    }

    // 4. Tambahkan Marker dan Isi Daftar Destinasi
    var placeList = document.getElementById('place-list');
    placeList.innerHTML = '';

    visitedPlaces.forEach(async function(place) { // Tambahkan 'async' di sini
        // Buat ikon kustom Leaflet dengan Font Awesome
        var customIcon = L.divIcon({
            html: `<i class="fa-solid ${place.icon || 'fa-map-pin'} fa-2x" style="color: #007bff;"></i>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -25]
        });

        var marker = L.marker(place.coords, { icon: customIcon }).addTo(mymap);
        markers.push(marker);

        // --- Tambahan untuk Konten Cuaca di Popup ---
        let weatherHtml = `<p>Memuat cuaca...</p>`; // Pesan awal

        const weatherData = await fetchWeather(place.coords[0], place.coords[1]);

        if (weatherData) {
            const temp = weatherData.main.temp.toFixed(0); // Suhu tanpa desimal
            const description = weatherData.weather[0].description; // Deskripsi cuaca
            const iconCode = weatherData.weather[0].icon; // Kode ikon
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`; // URL ikon cuaca

            weatherHtml = `
                <div class="weather-info text-center mt-2">
                    <img src="${iconUrl}" alt="${description}" class="weather-icon d-block mx-auto mb-1" style="width: 50px; height: 50px;">
                    <p class="mb-0"><strong>${temp}°C</strong></p>
                    <p class="mb-0 text-capitalize">${description}</p>
                </div>
            `;
        } else {
            weatherHtml = `<p class="text-danger mt-2">Gagal memuat cuaca.</p>`;
        }
        // --- Akhir Tambahan Cuaca di Popup ---

        // Buat konten popup dengan Carousel dan info cuaca
        var popupContent = `
            <div class="popup-header">${place.name}</div>
            ${createCarouselHtml(place.images)}
            <div class="popup-body">
                <small>Tanggal: ${place.date}</small>
                <p>${place.description}</p>
                ${weatherHtml} </div>
        `;
        marker.bindPopup(popupContent);

        // Tambahkan item ke daftar destinasi
        var listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.innerHTML = `
            <div>
                <i class="fa-solid ${place.icon || 'fa-map-pin'} me-2 text-primary"></i>
                <strong>${place.name}</strong> <br>
                <small class="text-muted">${place.date}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary fly-to-btn" data-lat="${place.coords[0]}" data-lon="${place.coords[1]}">
                <i class="fas fa-plane"></i> Terbang
            </button>
        `;
        listItem.dataset.lat = place.coords[0];
        listItem.dataset.lon = place.coords[1];
        placeList.appendChild(listItem);

        // Event listener untuk tombol "Terbang"
        listItem.querySelector('.fly-to-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            var lat = parseFloat(this.dataset.lat);
            var lon = parseFloat(this.dataset.lon);
            mymap.flyTo([lat, lon], 10, { // Zoom level 10
                duration: 2
            });
            setTimeout(() => {
                marker.openPopup();
            }, 2000);
        });

        // Event listener untuk klik item daftar (selain tombol terbang)
        listItem.addEventListener('click', function() {
            var lat = parseFloat(this.dataset.lat);
            var lon = parseFloat(this.dataset.lon);
            mymap.flyTo([lat, lon], 10, {
                duration: 2
            });
            setTimeout(() => {
                marker.openPopup();
            }, 2000);
        });

        // Event listener untuk animasi hover marker (saat mouse masuk/keluar)
        marker.on('mouseover', function() {
            this.getElement().style.color = '#ffc107'; // Warna kuning saat hover
        });
        marker.on('mouseout', function() {
            this.getElement().style.color = '#007bff'; // Kembali ke warna biru
        });
    });

    // 5. Fitur "Gambar Rute" Animasi
    document.getElementById('draw-route-btn').addEventListener('click', function() {
        if (markers.length < 2) {
            alert('Tambahkan setidaknya dua destinasi untuk menggambar rute!');
            return;
        }

        // Hapus rute lama jika ada
        if (routePolyline) {
            mymap.removeLayer(routePolyline);
        }

        // Ambil koordinat dari semua marker
        var latlngs = markers.map(m => m.getLatLng());

        // Buat polyline
        routePolyline = L.polyline(latlngs, {
            color: '#dc3545', // Merah Bootstrap
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10', // Untuk animasi putus-putus
            className: 'leaflet-travel-line' // Kelas untuk animasi CSS
        }).addTo(mymap);

        // Animasi agar peta "terbang" mengikuti rute
        mymap.flyToBounds(routePolyline.getBounds(), {
            padding: L.point(50, 50), // Padding agar rute tidak terlalu di pinggir
            duration: 3 // Durasi animasi terbang
        });
    });

    // 6. (Opsional) Menambahkan kemampuan klik untuk mendapatkan koordinat tempat baru
    // mymap.on('click', function(e) {
    //     var lat = e.latlng.lat.toFixed(4);
    //     var lon = e.latlng.lng.toFixed(4);
    //     alert(`Koordinat klik: ${lat}, ${lon}. Anda bisa menambahkan destinasi baru di sini!`);
    //     // Anda bisa menambahkan form modal untuk memasukkan detail tempat
    // });
});