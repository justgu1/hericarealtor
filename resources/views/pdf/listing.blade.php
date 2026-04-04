<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color:rgb(255, 255, 255); /* bv-white-500 */
            color: #11151C; /* bv-black-500 */
        }
        .page-break {
            page-break-after: always;
        }
        .banner {
            position: relative;
            width: 100%;
            text-align: center;
            overflow: hidden;
            background: linear-gradient(to right, #C18310 0%, #F9AF04 20%, #C18310 36%, #F7EB61 57%, #C18310 78%, #F9AF04 100%); /* bv-gradient */
            padding: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .banner img {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 0.5rem;
        }
        .banner-info {
            position: absolute;
            top: 0;
            left: 0;
            width: 200px;
            height: 50%;
            background: rgba(0, 0, 0, 0.75);
            padding: 20px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 2px solid #F9AF04; /* bv-orange-500 */
        }
        .banner-info p {
            margin: 10px 0;
            font-size: 14px;
        }
        .detailsKey {
            font-weight: bold;
            margin-right: 10px;
            color: #C08310; /* bv-brown-500 */
        }
        .detailsKey img {
            vertical-align: middle;
            margin-right: 5px;
            width: 16px;
            height: 16px;
        }
        .detailsValue {
            color: #fff; /* bv-black-500 */
        }
        .logo-container img {
            width: 100px;
            height: auto;
        }
        .description {
            padding: 20px;
            font-size: 14px;
            margin-top: 20px;
            background-color: #FBF8F4; /* bv-white-100 */
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .description h2 {
            font-family: 'Dancing Script', cursive, Arial, sans-serif;
            color: #C08310; /* bv-brown-500 */
            font-size: 24px;
            margin-bottom: 10px;
        }
        .gallery {
            padding: 20px;
            background-color: #FBF8F4; /* bv-white-100 */
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .gallery h2 {
            font-family: 'Dancing Script', cursive, Arial, sans-serif;
            color: #C08310; /* bv-brown-500 */
            font-size: 24px;
            margin-bottom: 10px;
        }
        .gallery table {
            width: 100%;
            border-collapse: collapse;
        }
        .gallery td {
            width: 33.33%;
            padding: 5px;
            vertical-align: top;
        }
        .gallery img {
            width: 100%;
            height: auto;
            border-radius: 0.5rem;
            display: block;
        }
        .schools-section {
            padding: 20px;
            background-color: #FBF8F4; /* bv-white-100 */
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .schools-section table {
            width: 100%;
            border-collapse: collapse;
        }
        .schools-list {
            width: 40%;
            padding-right: 20px;
            vertical-align: top;
        }
        .schools-list h2 {
            font-family: 'Dancing Script', cursive, Arial, sans-serif;
            color: #C08310; /* bv-brown-500 */
            font-size: 24px;
            margin-bottom: 10px;
        }
        .schools-list ul {
            list-style: none;
            padding: 0;
        }
        .schools-list li {
            margin-bottom: 5px;
            font-size: 14px;
            color: #11151C; /* bv-black-500 */
        }
        .sobrepositionAside {
            width: 60%;
            background: #F4EDE4; /* bv-white-500 */
            padding: 20px;
            text-align: center;
            vertical-align: top;
            border-left: 2px solid #F9AF04; /* bv-orange-500 */
        }
        .sobrepositionAside .logo {
            margin-bottom: 20px;
        }
        .sobrepositionAside .logo img {
            width: 100px;
            height: auto;
        }
        .sobrepositionAside .image img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 2px solid #F7EB61; /* bv-yellow-500 */
        }
        .sobrepositionAside .socialIcons ul {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        .sobrepositionAside .socialIcons li {
            display: inline-block;
            margin: 0 5px;
        }
        .sobrepositionAside .socialIcons img {
            width: 24px;
            height: 24px;
        }
        .map-section {
            padding: 20px;
            background-color: #FBF8F4; /* bv-white-100 */
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .map-section h2 {
            font-family: 'Dancing Script', cursive, Arial, sans-serif;
            color: #C08310; /* bv-brown-500 */
            font-size: 24px;
            margin-bottom: 10px;
        }
        .map-section img {
            width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }
    </style>
</head>
<body>
    <!-- Página 1: Banner + Descrição -->
    <div class="banner">
        <img src="{{ $listing['thumbnail_url'] ?? '' }}" alt="Thumbnail">
        <div class="banner-info">
            <div class="logo-container">
                <img src="{{ public_path('img/logo.png') }}" alt="Logo">
            </div>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/price.png') }}" alt="Price"> Price</span> <span class="detailsValue">{{ number_format($listing['price'], 0, '.', ',') }}</span></p>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/sqr_footage.png') }}" alt="Sqr Footage"> Sqr Footage</span> <span class="detailsValue">{{ $listing['sqr_footage'] }}</span></p>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/bedroom.png') }}" alt="Bedrooms"> Bedrooms</span> <span class="detailsValue">{{ $listing['bedrooms'] }}</span></p>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/bathroom.png') }}" alt="Bathrooms"> Bathrooms</span> <span class="detailsValue">{{ $listing['bathrooms'] }}</span></p>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/half_bathroom.png') }}" alt="Half Bathrooms"> Half Bathrooms</span> <span class="detailsValue">{{ $listing['half_bathrooms'] }}</span></p>
            <p><span class="detailsKey"><img src="{{ public_path('img/icons/type.png') }}" alt="Type"> Type</span> <span class="detailsValue">{{ $listing['type_enum']['name'] }}</span></p>
        </div>
    </div>
    <div class="description">
        <h2>Description</h2>
        <p>{!! \Illuminate\Support\Str::markdown($listing['description']) !!}</p>
    </div>
    <div class="page-break"></div>
    <!-- Página 2: Gallery -->
    <div class="gallery">
        <h2>Gallery</h2>
        <table>
            <tr>
                @foreach($listing['gallery'] as $index => $image)
                    <td><img src="{{ $image['image_url'] ?? '' }}" alt="Gallery Image"></td>
                    @if(($index + 1) % 3 == 0 && $index + 1 < count($listing['gallery']))
                        </tr><tr>
                    @endif
                @endforeach
                @while(count($listing['gallery']) % 3 != 0)
                    <td></td>
                    @php $listing['gallery'][] = null; @endphp
                @endwhile
            </tr>
        </table>
    </div>
    <div class="page-break"></div>
    <!-- Página 3: Schools + Aside + Map -->
    <div class="schools-section">
        <table>
            <tr>
                <td class="schools-list">
                    <h2>Nearby Schools</h2>
                    <ul>
                        @foreach($schools as $school)
                            <li>{{ $school['name'] }} - {{ $school['vicinity'] }}</li>
                        @endforeach
                    </ul>
                </td>
                <td class="sobrepositionAside">
                    <div class="image">
                        <img src="{{ public_path('img/herica.png') }}" alt="Herica">
                    </div>
                    <div class="socialIcons">
                        <ul>
                            <li><a href="https://www.facebook.com/HericaDeOliveiraRealtor"><img src="{{ public_path('img/icons/facebook.png') }}" alt="Facebook"></a></li>
                            <li><a href="https://www.instagram.com/hericadeoliveirarealtor"><img src="{{ public_path('img/icons/instagram.png') }}" alt="Instagram"></a></li>
                            <li><a href="https://wa.me/15085092287"><img src="{{ public_path('img/icons/whatsapp.png') }}" alt="WhatsApp"></a></li>
                            <li><a href="tel:+1508-509-2287"><img src="{{ public_path('img/icons/phone.png') }}" alt="Phone"></a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        </table>
    </div>
    <div class="map-section">
        <h2>Property Location</h2>
        @if($mapBase64)
            <img src="{{ $mapBase64 }}" alt="Property Map">
        @else
            <p>Mapa indisponível</p>
        @endif
    </div>
</body>
</html>