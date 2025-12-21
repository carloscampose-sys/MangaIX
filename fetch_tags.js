import axios from 'axios';
import fs from 'fs';

const fetchTags = async () => {
    try {
        const response = await axios.get('https://api.mangadex.org/manga/tag');
        const tags = response.data.data;
        const targetTags = ['Boys\' Love', 'Romance', 'Action', 'Isekai', 'Comedy', 'Drama', 'Fantasy', 'Slice of Life'];

        let output = '';
        tags.forEach(tag => {
            const name = tag.attributes.name.en;
            if (targetTags.includes(name)) {
                output += `${name}: ${tag.id}\n`;
            }
        });
        fs.writeFileSync('tags.txt', output);
        console.log('Tags saved to tags.txt');
    } catch (error) {
        console.error(error);
    }
};

fetchTags();
