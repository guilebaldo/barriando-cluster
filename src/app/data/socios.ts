export interface Socio {
  id: number;
  name: string;
  categoria: string;
  foto: string;
  url: string;
  direccion?: string;
  telefono?: string;
}

export const listaSocios: Socio[] = [

  {
    id: 1,
    name: "Acaso Homes",
    categoria: "Hospedaje",
    foto: "acaso",
    url: "https://www.acasohomes.com/es/",
    direccion: "https://maps.app.goo.gl/HBBAfCkHSp3uJoMS9"
  },
  {
    id: 2,
    name: "Barrio del Alto",
    categoria: "Tours",
    foto: "alto",
    url: "https://www.facebook.com/profile.php?id=100064926900530",
    direccion: "https://maps.app.goo.gl/CgpiK6VkQKWNXr566"
  },
  {
    id: 3,
    name: "Museo Amparo",
    categoria: "Museo",
    foto: "amparo",
    url: "https://museoamparo.com",
    direccion: "https://maps.app.goo.gl/25HLVRWXDKyZ9Gzx9"
  },
  {
    id: 4,
    name: "Galería Los Ángeles",
    categoria: "Arte",
    foto: "angeles",
    url: "https://www.instagram.com/galerialosangeles_/",
    direccion: "https://maps.app.goo.gl/4isxqFfNk1oRY5oV9"
  },
  {
    id: 5,
    name: "ArboTerra",
    categoria: "Tours",
    foto: "arboterra",
    url: "https://arboterra.com.mx",
    direccion: "https://maps.app.goo.gl/ZmFJJQKnb7FcvNGg6"
  },
  {
    id: 6,
    name: "La Berenjena",
    categoria: "Alimentos y Bebidas",
    foto: "bere",
    url: "https://www.laberenjenapizza.com",
    direccion: "https://maps.app.goo.gl/1LE5ZRqvvF7i2onu7"
  },
  {
    id: 7,
    name: "Cartesiano",
    categoria: "Hospedaje",
    foto: "cartesiano",
    url: "https://www.cartesiano360.com/?partner=13037&utm_source=google&utm_medium=organic&utm_campaign=MyBusiness",
    direccion: "https://maps.app.goo.gl/sVrcFTNB3w36h2xH9"
  },
  {
    id: 8,
    name: "La Colecturía",
    categoria: "Alimentos y Bebidas",
    foto: "colecturia",
    url: "https://lacolecturia.com",
    direccion: "https://maps.app.goo.gl/pkpzGWcpoP8fFTf87"
  },
  {
    id: 9,
    name: "Hotel Colonial",
    categoria: "Hospedaje",
    foto: "colonial",
    url: "https://www.colonial.com.mx",
    direccion: "https://maps.app.goo.gl/Sp1xWLQ5yGSZKLHbA"
  },
  {
    id: 10,
    name: "Comal",
    categoria: "Alimentos y Bebidas",
    foto: "comal",
    url: "https://www.instagram.com/comalcocinalocal/",
    direccion: "https://maps.app.goo.gl/bVdev1FrfBav2Wf59"
  },
  {
    id: 11,
    name: "Cosme Tortas",
    categoria: "Alimentos y Bebidas",
    foto: "cosme",
    url: "https://menu.fu.do/cosmetortas",
    direccion: "https://maps.app.goo.gl/iJoaUtfQk1476t3G7"
  },
  {
    id: 12,
    name: "Destilado Urbano",
    categoria: "Bebidas",
    foto: "destilado",
    url: "https://destiladourbano.com",
    direccion: "https://maps.app.goo.gl/yuNNReqNioBenMQa7"
  },
  {
    id: 13,
    name: "La Fonda de Santa Clara",
    categoria: "Alimentos y Bebidas",
    foto: "fonda",
    url: "https://fondadesantaclara.com",
    direccion: "https://maps.app.goo.gl/AgK4nBFry9ZVcmRU9"
  },
  {
    id: 14,
    name: "Talavera de La Luz",
    categoria: "Arte",
    foto: "laluz",
    url: "https://www.talaveradelaluz.com",
    direccion: "https://maps.app.goo.gl/9GYUwwCcoyDxgsEh9"
  },
  {
    id: 15,
    name: "Casona María",
    categoria: "Hospedaje",
    foto: "maria",
    url: "https://www.casonamaria.com",
    direccion: "https://maps.app.goo.gl/b25o2khvCEQySR9XA"
  },
  {
    id: 16,
    name: "La Casa del Mendrugo",
    categoria: "Alimentos y Bebidas",
    foto: "mendrugo",
    url: "https://www.casadelmendrugo.com",
    direccion: "https://maps.app.goo.gl/AicEtegJnTiHKvGn8"
  },
  {
    id: 17,
    name: "Salón Mezcalli",
    categoria: "Alimentos y Bebidas",
    foto: "mezcalli",
    url: "https://salonmezcalli.mx",
    direccion: "https://maps.app.goo.gl/wW6wCPxdHewLRvML9"
  },
  {
    id: 18,
    name: "Mural de los Poblanos",
    categoria: "Alimentos y Bebidas",
    foto: "mural",
    url: "https://elmuraldelospoblanos.com",
    direccion: "https://maps.app.goo.gl/P2nmkmrn1FfbkViL6"
  },
  {
    id: 19,
    name: "Hotel Nube",
    categoria: "Hospedaje",
    foto: "nube",
    url: "https://www.hotelnubepuebla.com",
    direccion: "https://maps.app.goo.gl/NR7HJ8X9SojKFu1u8"
  },
  {
    id: 20,
    name: "Hotel Casa de la Palma",
    categoria: "Hospedaje",
    foto: "palma",
    url: "https://www.casadelapalmapuebla.com",
    direccion: "https://maps.app.goo.gl/DvKL818pHqHKy3yt7"
  },
  {
    id: 21,
    name: "Perla L'Hotel Boutique",
    categoria: "Hospedaje",
    foto: "perla",
    url: "https://laperlahotelboutique.com",
    direccion: "https://maps.app.goo.gl/tbYg39Kuzwox61NH6"
  },
  {
    id: 22,
    name: "Grupo Plaza",
    categoria: "Alimentos y Bebidas",
    foto: "plaza",
    url: "https://grupocafeplaza.mx",
    direccion: "https://maps.app.goo.gl/EHSKXsheijSrtoa18"
  },
  {
    id: 23,
    name: "Priesca",
    categoria: "Alimentos y Bebidas",
    foto: "priesca",
    url: "https://www.instagram.com/priesca2022/",
    direccion: "https://maps.app.goo.gl/btEFqHrTM2MGLtTJ9"
  },
  {
    id: 24,
    name: "Restauro",
    categoria: "Alimentos y Bebidas",
    foto: "restauro",
    url: "https://www.restauro.mx",
    direccion: "https://maps.app.goo.gl/PFaskqT8BfpbtJZ58"
  },
  {
    id: 25,
    name: "Casa Sabino",
    categoria: "Alimentos y Bebidas",
    foto: "sabino",
    url: "https://www.instagram.com/casa.sabino/?hl=es",
    direccion: "https://maps.app.goo.gl/D2tQyfXYfa7YFUkDA"
  },
  {
    id: 26,
    name: "SIGSA",
    categoria: "Servicios",
    foto: "sigsa",
    url: "https://www.sigsa.info",
    direccion: "https://maps.app.goo.gl/KHJaS5sCzxzewnd3A"
  },
  {
    id: 27,
    name: "Tina Valente",
    categoria: "Arte",
    foto: "tina",
    url: "https://www.instagram.com/tinavalentedesigner/",
    direccion: "https://maps.app.goo.gl/MewipnmCnR2S5Ufv6"
  },
  {
    id: 28,
    name: "Vittorio's",
    categoria: "Alimentos y Bebidas",
    foto: "vittorios",
    url: "https://restaurantevittorios.com",
    direccion: "https://maps.app.goo.gl/roxPBsFNgDSx9p9D8"
  },
  {
    id: 29,
    name: "CIEX",
    categoria: "Educación",
    foto: "ciex",
    url: "https://www.ciex.edu.mx",
    direccion: "https://maps.app.goo.gl/zNouoAgBTi4oSdue8"
  },
  {
    id: 30,
    name: "Muebles y Antiguedades Casa Nicho",
    categoria: "Arte",
    foto: "nicho",
    url: "https://www.facebook.com/p/Carlos-Olea-Muebles-y-Antiguedades-100054365149225/",
    direccion: "https://maps.app.goo.gl/Q11CgY8CTLJ2bv9C8"
  },
  {
    id: 31,
    name: "Fundación Espinoza Rugarcia IBP",
    categoria: "Educación",
    foto: "ibp",
    url: "https://www.fundacionesru.org/es/index.php",
    direccion: "https://maps.app.goo.gl/VdWHkScP6duoWRNo7"
  },
  {
    id: 32,
    name: "Sportips",
    categoria: "Ropa y Calzado",
    foto: "sportips",
    url: "https://www.facebook.com/SportTipsPuebla",
    direccion: "https://maps.app.goo.gl/4rJpYdwtbyyN6sbaA"
  },
  {
    id: 33,
    name: "SACRISTÍA",
    categoria: "Hospedaje",
    foto: "sacristia",
    url: "https://mesones-sacristia.com",
    direccion: "https://maps.app.goo.gl/zKhCw7epECEd9SLD7"
  },
  {
    id: 34,
    name: "IL GUSTO",
    categoria: "Alimentos y Bebidas",
    foto: "gusto",
    url: "https://www.facebook.com/ilgustogiustomx",
    direccion: "https://maps.app.goo.gl/4UQuzp3iLgfFSetr6"
  },
  {
    id: 35,
    name: "La Quinta de San Antonio",
    categoria: "Arte",
    foto: "quinta",
    url: "https://www.facebook.com/LaQuintaDeSanAntonioAntiguedadesYArtePopular/?locale=es_LA",
    direccion: "https://maps.app.goo.gl/eKkFbf5XisLd44vz6"
  },
  {
    id: 36,
    name: "Hotel El Milagro",
    categoria: "Hospedaje",
    foto: "milagro",
    url: "https://www.milagrohotel.com",
    direccion: "https://maps.app.goo.gl/BT3MgLow3gveR4Jj9"
  },
  {
    id: 37,
    name: "Antigüedades René Antiques",
    categoria: "Arte",
    foto: "rene",
    url: "https://www.instagram.com/rene_nieto/",
    direccion: "https://maps.app.goo.gl/uuWN7FKWYXEPjCLg8"
  },
  {
    id: 38,
    name: "Bakery café",
    categoria: "Alimentos y Bebidas",
    foto: "bakery",
    url: "https://www.facebook.com/Bakerycafepuebla/?locale=es_LA",
    direccion: "https://maps.app.goo.gl/ZBekAULMrMffrpa78"
  },
  {
    id: 39,
    name: "Hotel El Sueño",
    categoria: "Hospedaje",
    foto: "sueno",
    url: "https://www.elsueno-hotel.com",
    direccion: "https://maps.app.goo.gl/GinmCfGJ8WzbmYJ17"
  },
  {
    id: 40,
    name: "SANTALAVERA",
    categoria: "Alimentos y Bebidas",
    foto: "santalavera",
    url: "https://www.facebook.com/SantalaveraMX/?locale=es_LA",
    direccion: "https://maps.app.goo.gl/UxpKSDR1TVNDiwy2A"
  },
  {
    id: 41,
    name: "COMEX",
    categoria: "Materiales",
    foto: "comex",
    url: "https://www.comex.com.mx",
    direccion: "https://maps.app.goo.gl/bLXj3ViAWVcmfUAZ6"
  },
  {
    id: 42,
    name: "Zócalo Restaurante",
    categoria: "Alimentos y Bebidas",
    foto: "zocalos",
    url: "https://www.facebook.com/zocaloskaraoke/?locale=es_LA",
    direccion: "https://maps.app.goo.gl/ruQJLquULrNsbk9e6"
  },
  {
    id: 43,
    name: "Subway",
    categoria: "Alimentos y Bebidas",
    foto: "subway",
    url: "https://restaurantes.subway.com/subway-puebla-puebla-57908",
    direccion: "https://maps.app.goo.gl/jZY4aoP6Vf85J5aU6"
  },
  {
    id: 44,
    name: "Celia´s Café",
    categoria: "Alimentos y Bebidas",
    foto: "celias",
    url: "https://www.celiascafe.com",
    direccion: "https://maps.app.goo.gl/ZUDqbhVFRjPZR8Ty8"
  },
  {
    id: 45,
    name: "Galería 16",
    categoria: "Arte",
    foto: "galeria16",
    url: "https://www.instagram.com/galeria_16_art/",
    direccion: "https://maps.app.goo.gl/TkAZ3F2WsPwdpf7H6"
  },
  {
    id: 46,
    name: "Turísticos Poblanos",
    categoria: "Tours",
    foto: "turisticos",
    url: "https://turisticospoblanos.com",
    direccion: "https://maps.app.goo.gl/cnRDPx45Nb7mRu7y5"
  },
  {
    id: 47,
    name: "Banyan Tree",
    categoria: "Hospedaje",
    foto: "banyan",
    url: "https://www.banyantree.com/es/mexico/puebla",
    direccion: "https://maps.app.goo.gl/9MDzv1SLkoDFHi236"
  },
  {
    id: 48,
    name: "Hotel Escala",
    categoria: "Hospedaje",
    foto: "escala",
    url: "https://www.hotelesescala.com/escala-puebla-centro",
    direccion: "https://maps.app.goo.gl/j1pGidP6z4x5cUdd7"
  },
  {
    id: 49,
    name: "Hospital CHRISTUS MUGUERZA UPAEP",
    categoria: "Hospital",
    foto: "upaep",
    url: "https://christusmuguerza.com.mx/hospital-upaep/?utm_source=google_my_business",
    direccion: "https://maps.app.goo.gl/8TGdJjaLLtg9yYqP8"
  },
  {
    id: 50,
    name: "El Parador de La Luz",
    categoria: "Hospedaje",
    foto: "parador",
    url: "https://baiku.com.mx/proyectos-proyecto-PwTbaO",
    direccion: "https://maps.app.goo.gl/uk1ajFSS9u1N1BPF8"
  }

  ];;
