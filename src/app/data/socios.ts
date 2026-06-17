export interface Socio {
    id: number;
    name: string;
    categoria: string;
    foto: string;
    url: string;
    maps: string;
  }
  
  export const listaSocios: Socio[] = [
    { id: 1, name: 'Acaso Homes', categoria: 'Hospedaje', foto: 'acaso', url: 'https://www.acasohomes.com/es/', maps: 'https://maps.app.goo.gl/HBBAfCkHSp3uJoMS9' },
    { id: 2, name: 'Barrio del Alto', categoria: 'Tours', foto: 'alto', url: 'https://www.facebook.com/profile.php?id=100064926900530', maps: 'https://maps.app.goo.gl/CgpiK6VkQKWNXr566' },
    { id: 3, name: 'Museo Amparo', categoria: 'Museo', foto: 'amparo', url: 'https://museoamparo.com', maps: 'https://maps.app.goo.gl/25HLVRWXDKyZ9Gzx9' },
    { id: 4, name: 'Galería Los Ángeles', categoria: 'Arte', foto: 'angeles', url: 'https://www.instagram.com/galerialosangeles_/', maps: 'https://maps.app.goo.gl/4isxqFfNk1oRY5oV9' },
    { id: 5, name: 'ArboTerra', categoria: 'Tours', foto: 'arboterra', url: 'https://arboterra.com.mx', maps: 'https://maps.app.goo.gl/ZmFJJQKnb7FcvNGg6' },
    { id: 6, name: 'La Berenjena', categoria: 'Alimentos y Bebidas', foto: 'bere', url: 'https://www.laberenjenapizza.com', maps: 'https://maps.app.goo.gl/1LE5ZRqvvF7i2onu7' },
    { id: 7, name: 'Cartesiano', categoria: 'Hospedaje', foto: 'cartesiano', url: 'http://www.cartesiano360.com/?partner=13037&utm_source=google&utm_medium=organic&utm_campaign=MyBusiness', maps: 'https://maps.app.goo.gl/sVrcFTNB3w36h2xH9' },
    { id: 8, name: 'La Colecturía', categoria: 'Alimentos y Bebidas', foto: 'colecturia', url: 'https://lacolecturia.com', maps: 'https://maps.app.goo.gl/pkpzGWcpoP8fFTf87' },
    { id: 9, name: 'Hotel Colonial', categoria: 'Hospedaje', foto: 'colonial', url: 'https://www.colonial.com.mx', maps: 'https://maps.app.goo.gl/Sp1xWLQ5yGSZKLHbA' },
    { id: 10, name: 'Comal', categoria: 'Alimentos y Bebidas', foto: 'comal', url: 'https://www.instagram.com/comalcocinalocal/', maps: 'https://maps.app.goo.gl/bVdev1FrfBav2Wf59' },
    { id: 11, name: 'Cosme Tortas', categoria: 'Alimentos y Bebidas', foto: 'cosme', url: 'https://menu.fu.do/cosmetortas', maps: 'https://maps.app.goo.gl/iJoaUtfQk1476t3G7' },
    { id: 12, name: 'Destilado Urbano', categoria: 'Bebidas', foto: 'destilado', url: 'https://destiladourbano.com', maps: 'https://maps.app.goo.gl/yuNNReqNioBenMQa7' },
    { id: 13, name: 'La Fonda de Santa Clara', categoria: 'Alimentos y Bebidas', foto: 'fonda', url: 'https://fondadesantaclara.com', maps: 'https://maps.app.goo.gl/AgK4nBFry9ZVcmRU9' },
    { id: 14, name: 'Talavera de La Luz', categoria: 'Arte', foto: 'laluz', url: 'https://www.talaveradelaluz.com', maps: 'https://maps.app.goo.gl/9GYUwwCcoyDxgsEh9' },
    { id: 15, name: 'Casona María', categoria: 'Hospedaje', foto: 'maria', url: 'https://www.casonamaria.com', maps: 'https://maps.app.goo.gl/b25o2khvCEQySR9XA' },
    { id: 16, name: 'La Casa del Mendrugo', categoria: 'Alimentos y Bebidas', foto: 'mendrugo', url: 'https://www.casadelmendrugo.com', maps: 'https://maps.app.goo.gl/AicEtegJnTiHKvGn8' },
    { id: 17, name: 'Salón Mezcalli', categoria: 'Alimentos y Bebidas', foto: 'mezcalli', url: 'https://salonmezcalli.mx', maps: 'https://maps.app.goo.gl/wW6wCPxdHewLRvML9' },
    { id: 18, name: 'Mural de los Poblanos', categoria: 'Alimentos y Bebidas', foto: 'mural', url: 'http://elmuraldelospoblanos.com', maps: 'https://maps.app.goo.gl/P2nmkmrn1FfbkViL6' },
    { id: 19, name: 'Hotel Nube', categoria: 'Hospedaje', foto: 'nube', url: 'https://www.hotelnubepuebla.com', maps: 'https://maps.app.goo.gl/NR7HJ8X9SojKFu1u8' },
    { id: 20, name: 'Hotel Casa de la Palma', categoria: 'Hospedaje', foto: 'palma', url: 'http://www.casadelapalmapuebla.com', maps: 'https://maps.app.goo.gl/DvKL818pHqHKy3yt7' },
    { id: 21, name: 'Perla L\'Hotel Boutique', categoria: 'Hospedaje', foto: 'perla', url: 'https://laperlahotelboutique.com', maps: 'https://maps.app.goo.gl/tbYg39Kuzwox61NH6' },
    { id: 22, name: 'Grupo Plaza', categoria: 'Alimentos y Bebidas', foto: 'plaza', url: 'https://grupocafeplaza.mx', maps: 'https://maps.app.goo.gl/EHSKXsheijSrtoa18' },
    { id: 23, name: 'Priesca', categoria: 'Alimentos y Bebidas', foto: 'priesca', url: 'https://www.instagram.com/priesca2022/', maps: 'https://maps.app.goo.gl/btEFqHrTM2MGLtTJ9' },
    { id: 24, name: 'Restauro', categoria: 'Alimentos y Bebidas', foto: 'restauro', url: 'https://www.restauro.mx', maps: 'https://maps.app.goo.gl/PFaskqT8BfpbtJZ58' },
    { id: 25, name: 'Casa Sabino', categoria: 'Alimentos y Bebidas', foto: 'sabino', url: 'https://www.instagram.com/casa.sabino/?hl=es', maps: 'https://maps.app.goo.gl/D2tQyfXYfa7YFUkDA' },
    { id: 26, name: 'SIGSA', categoria: 'Servicios', foto: 'sigsa', url: 'https://www.sigsa.info', maps: 'https://maps.app.goo.gl/KHJaS5sCzxzewnd3A' },
    { id: 27, name: 'Tina Valente', categoria: 'Arte', foto: 'tina', url: 'https://www.instagram.com/tinavalentedesigner/', maps: 'https://maps.app.goo.gl/MewipnmCnR2S5Ufv6' },
    { id: 28, name: 'Vittorio\'s', categoria: 'Alimentos y Bebidas', foto: 'vittorios', url: 'https://restaurantevittorios.com', maps: 'https://maps.app.goo.gl/roxPBsFNgDSx9p9D8' }
  ];