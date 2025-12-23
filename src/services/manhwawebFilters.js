/**
 * Filtros y constantes para ManhwaWeb
 * Basados en la estructura real de manhwaweb.com
 * @version 1.0.0 - Implementación completa de filtros ManhwaWeb
 * @date 2025-12-22
 * @author Potaxie Dev Team
 */

// Géneros disponibles en ManhwaWeb (IDs correctos según la web real)
export const MANHWAWEB_GENRES = [
    { name: "Acción 💥", id: "accion", value: "3" },
    { name: "Drama 🎭", id: "drama", value: "1" },
    { name: "Romance 💞", id: "romance", value: "2" },
    { name: "Venganza ⚔️", id: "venganza", value: "5" },
    { name: "Harem 👯", id: "harem", value: "6" },
    { name: "Milf 💋", id: "milf", value: "8" },
    { name: "Comedia 🤣", id: "comedia", value: "18" },
    { name: "Fantasía 🧚", id: "fantasia", value: "23" },
    { name: "Tragedia 🥀", id: "tragedia", value: "25" },
    { name: "Girls love 🌸", id: "girls-love", value: "27" },
    { name: "Historias cortas 📄", id: "historias-cortas", value: "28" },
    { name: "Aventura 🗺️", id: "aventura", value: "29" },
    { name: "Ecchi 😳", id: "ecchi", value: "30" },
    { name: "Sobrenatural 👻", id: "sobrenatural", value: "31" },
    { name: "Horror 💀", id: "horror", value: "32" },
    { name: "Ciencia ficción 🚀", id: "ciencia-ficcion", value: "33" },
    { name: "Gore 🩸", id: "gore", value: "34" },
    { name: "Cultivación 🌱", id: "cultivacion", value: "35" },
    { name: "Sistema de niveles 📊", id: "sistema-niveles", value: "37" },
    { name: "Apocalíptico 🌋", id: "apocaliptico", value: "38" },
    { name: "Artes marciales 🥋", id: "artes-marciales", value: "39" },
    { name: "Superpoderes 💪", id: "superpoderes", value: "40" },
    { name: "Reencarnación ✨", id: "reencarnacion", value: "41" },
    { name: "Recuentos de la vida 📖", id: "recuentos", value: "42" },
    { name: "Psicológico 🧠", id: "psicologico", value: "43" },
    { name: "Thriller 🔪", id: "thriller", value: "44" },
    { name: "Boys love 💕", id: "boys-love", value: "45" }
];

// Tipos de obra
export const MANHWAWEB_TYPES = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Manhwa 🇰🇷", id: "manhwa", value: "manhwa" },
    { name: "Manga 🇯🇵", id: "manga", value: "manga" },
    { name: "Manhua 🇨🇳", id: "manhua", value: "manhua" },
    { name: "Doujinshi 📚", id: "doujinshi", value: "doujinshi" },
    { name: "Novela 📖", id: "novela", value: "novela" },
    { name: "One shot ⭐", id: "oneshot", value: "one_shot" }  // Guión bajo
];

// Estado de publicación
export const MANHWAWEB_STATUS = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Publicándose 📝", id: "ongoing", value: "publicandose" },  // Sin tilde
    { name: "Pausado ⏸️", id: "paused", value: "pausado" },
    { name: "Finalizado ✅", id: "completed", value: "finalizado" }     // En español
];

// Contenido erótico
export const MANHWAWEB_EROTIC = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Sí 🔞", id: "yes", value: "si" },  // En español
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
    { name: "Alfabético", id: "alfabetico", value: "alfabetico" },           // Sin tilde
    { name: "Creación", id: "creacion", value: "creacion" },                 // Sin tilde
    { name: "Núm. Capítulos", id: "num_chapter", value: "num_chapter" }      // Guión bajo
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
        genres: [1, 25],  // Drama (1), Tragedia (25)
        toast: "Busca los pañuelos, que hoy se llora... 😭",
        color: "from-blue-400 to-blue-600"
    },
    {
        name: "Colapso de amor 😍",
        id: "love",
        genres: [2, 18],  // Romance (2), Comedia (18)
        toast: "Prepárate para el colapso de azúcar, divina... 😍",
        color: "from-pink-400 to-rose-600"
    },
    {
        name: "Chisme y traición 🐍",
        id: "tea",
        genres: [1, 43],  // Drama (1), Psicológico (43)
        toast: "Prepárate, que el chisme viene fuerte... 🐍☕",
        color: "from-indigo-400 to-purple-600"
    },
    {
        name: "¡A devorar! 💅",
        id: "devour",
        genres: [3, 23, 40],  // Acción (3), Fantasía (23), Superpoderes (40)
        toast: "¡Poder total activado! Vas a devorar... 💅",
        color: "from-potaxie-green to-teal-600"
    },
    {
        name: "Noche de terror 🕯️",
        id: "fear",
        genres: [32, 44],  // Horror (32), Thriller (44)
        toast: "No mires atrás... el misterio te espera... 🕯️",
        color: "from-gray-700 to-gray-900"
    },
    {
        name: "Poder sin límites ⚡",
        id: "power",
        genres: [37, 35, 41],  // Sistema niveles (37), Cultivación (35), Reencarnación (41)
        toast: "¡Level up! Prepárate para el OP... ⚡",
        color: "from-yellow-400 to-orange-600"
    }
];
