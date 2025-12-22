/**
 * Filtros y constantes para ManhwaWeb
 * Basados en la estructura real de manhwaweb.com
 */

// Géneros disponibles en ManhwaWeb
export const MANHWAWEB_GENRES = [
    { name: "Acción 💥", id: "accion", value: "3" },
    { name: "Aventura 🗺️", id: "aventura", value: "4" },
    { name: "Comedia 🤣", id: "comedia", value: "5" },
    { name: "Drama 🎭", id: "drama", value: "6" },
    { name: "Recuentos de la vida 📖", id: "recuentos", value: "7" },
    { name: "Romance 💞", id: "romance", value: "8" },
    { name: "Venganza ⚔️", id: "venganza", value: "9" },
    { name: "Harem 👯", id: "harem", value: "10" },
    { name: "Fantasía 🧚", id: "fantasia", value: "11" },
    { name: "Sobrenatural 👻", id: "sobrenatural", value: "12" },
    { name: "Tragedia 🥀", id: "tragedia", value: "13" },
    { name: "Psicológico 🧠", id: "psicologico", value: "14" },
    { name: "Horror 💀", id: "horror", value: "15" },
    { name: "Thriller 🔪", id: "thriller", value: "16" },
    { name: "Historias cortas 📄", id: "historias-cortas", value: "17" },
    { name: "Ecchi 😳", id: "ecchi", value: "18" },
    { name: "Gore 🩸", id: "gore", value: "19" },
    { name: "Girls love 🌸", id: "girls-love", value: "20" },
    { name: "Boys love 💕", id: "boys-love", value: "21" },
    { name: "Reencarnación ✨", id: "reencarnacion", value: "22" },
    { name: "Sistema de niveles 📊", id: "sistema-niveles", value: "23" },
    { name: "Ciencia ficción 🚀", id: "ciencia-ficcion", value: "24" },
    { name: "Apocalíptico 🌋", id: "apocaliptico", value: "25" },
    { name: "Artes marciales 🥋", id: "artes-marciales", value: "26" },
    { name: "Superpoderes 💪", id: "superpoderes", value: "27" },
    { name: "Cultivación 🌱", id: "cultivacion", value: "28" },
    { name: "Milf 💋", id: "milf", value: "29" }
];

// Tipos de obra
export const MANHWAWEB_TYPES = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Manhwa 🇰🇷", id: "manhwa", value: "manhwa" },
    { name: "Manga 🇯🇵", id: "manga", value: "manga" },
    { name: "Manhua 🇨🇳", id: "manhua", value: "manhua" },
    { name: "Doujinshi 📚", id: "doujinshi", value: "doujinshi" },
    { name: "Novela 📖", id: "novela", value: "novela" },
    { name: "One shot ⭐", id: "oneshot", value: "oneshot" }
];

// Estado de publicación
export const MANHWAWEB_STATUS = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Publicándose 📝", id: "ongoing", value: "ongoing" },
    { name: "Pausado ⏸️", id: "paused", value: "paused" },
    { name: "Finalizado ✅", id: "completed", value: "completed" }
];

// Contenido erótico
export const MANHWAWEB_EROTIC = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Sí 🔞", id: "yes", value: "yes" },
    { name: "No 👍", id: "no", value: "no" }
];

// Demografía
export const MANHWAWEB_DEMOGRAPHICS = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Seinen 🎯", id: "seinen", value: "seinen" },
    { name: "Shonen ⚡", id: "shonen", value: "shonen" },
    { name: "Josei 🌺", id: "josei", value: "josei" },
    { name: "Shojo 🌸", id: "shojo", value: "shojo" }
];

// Criterios de ordenamiento
export const MANHWAWEB_SORT_BY = [
    { name: "Alfabético", id: "alphabetic", value: "alphabetic" },
    { name: "Creación", id: "creation", value: "creation" },
    { name: "Núm. Capítulos", id: "chapters", value: "chapters" }
];

// Dirección del ordenamiento
export const MANHWAWEB_SORT_ORDER = [
    { name: "DESC ⬇️", id: "desc", value: "desc" },
    { name: "ASC ⬆️", id: "asc", value: "asc" }
];

// Moods para ManhwaWeb (basados en sus géneros disponibles)
export const MANHWAWEB_MOODS = [
    {
        name: "Quiero llorar 😭",
        id: "cry",
        genres: ["drama", "tragedia"],
        toast: "Busca los pañuelos, que hoy se llora... 😭",
        color: "from-blue-400 to-blue-600"
    },
    {
        name: "Colapso de amor 😍",
        id: "love",
        genres: ["romance", "comedia"],
        toast: "Prepárate para el colapso de azúcar, divina... 😍",
        color: "from-pink-400 to-rose-600"
    },
    {
        name: "Chisme y traición 🐍",
        id: "tea",
        genres: ["drama", "psicologico"],
        toast: "Prepárate, que el chisme viene fuerte... 🐍☕",
        color: "from-indigo-400 to-purple-600"
    },
    {
        name: "¡A devorar! 💅",
        id: "devour",
        genres: ["accion", "fantasia", "superpoderes"],
        toast: "¡Poder total activado! Vas a devorar... 💅",
        color: "from-potaxie-green to-teal-600"
    },
    {
        name: "Noche de terror 🕯️",
        id: "fear",
        genres: ["horror", "thriller"],
        toast: "No mires atrás... el misterio te espera... 🕯️",
        color: "from-gray-700 to-gray-900"
    },
    {
        name: "Poder sin límites ⚡",
        id: "power",
        genres: ["sistema-niveles", "cultivacion", "reencarnacion"],
        toast: "¡Level up! Prepárate para el OP... ⚡",
        color: "from-yellow-400 to-orange-600"
    }
];
