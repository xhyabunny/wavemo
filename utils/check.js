import { print } from "wavemo/utils/print";

export const isCSSColor = (colorString) => {
    const hexRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
    const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
    const rgbaRegex = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)$/;
    const namedColorRegex = /^(red|green|blue|yellow|orange|purple|cyan|magenta|black|white|gray|transparent)$/;

    return hexRegex.test(colorString) || 
           rgbRegex.test(colorString) || 
           rgbaRegex.test(colorString) ||
           namedColorRegex.test(colorString);
};

export function findRepeatedWords(arr, logs, index) {
    const wordCount = {};
    arr.forEach(word => {
        if (wordCount[word]) {
            wordCount[word]++;
        } else {
            wordCount[word] = 1;
        }
    });

    let repeatedWords = {};
    for (let word in wordCount) {
        if (wordCount[word] > 1) {
            repeatedWords[word] = wordCount[word];
        }
    }

    for (let word in repeatedWords) {
        print(logs, 'error', `EFFECT_ERROR\nEFFECT ${word} IS REPEATED AT ELEMENT[${index}] ${repeatedWords[word] == 1 ? `${repeatedWords[word]} TIME` : `${repeatedWords[word]} TIMES`}`)
    }

    return Object.keys(repeatedWords);
}

export function dynamicRepl(str, intensit) {
    // Regular expression to capture numbers inside curly braces
    const regex = /\{([\d.]+)\}/g;

    // Replace occurrences of "{number}" with the value of intensit + number
    return str.replace(regex, (match, number) => {
        const value = parseFloat(number) + intensit;
        return `${value}`;
    });
}