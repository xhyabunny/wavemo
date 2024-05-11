import { useEffect, useRef } from 'react'
import { easeInOutQuad } from './utils/math';
import { print } from './utils/print';
import { dynamicRepl, findRepeatedWords, isCSSColor } from './utils/check';

const useVisualizer = (audioRef, options, elements) => {

    /*
    options: {
        minFreq: number,
        maxFreq: number,
        invisible: boolean, 
        quality: string, // "ultra" > "high" > "medium" > "low" > "verylow",
        play: boolean,
        logs: {
            warn: boolean,
            error: boolean,
            info: boolean
        }
    }

    elements: [
        {
            ref: useRef,
            effects: [
                {
                    type: string,
                    blending: number,
                    intensity: number,
                    color: string
                }
            ]
        }
    ]
    */

    const defaults = {
        color: 'white',
        blending: 300,
        intensity: 2,
        minFreq: 0,
        maxFreq: 1400,
        quality: {
            number: 512,
            string: "medium"
        },
        logs: {
            warn: true,
            error: true,
            info: true,
            buffer: true
        }
    }

    let _SHOW_WARN = 
    options.logs.warn != null && 
    options.logs.warn == true || 
    options.logs.warn == false ? 
    options.logs.warn : 
    defaults.logs.warn

    let _SHOW_ERROR = 
    options.logs.error != null && 
    options.logs.error == true || 
    options.logs.error == false ? 
    options.logs.error : 
    defaults.logs.error

    let _SHOW_INFO = 
    options.logs.info != null && 
    options.logs.info == true || 
    options.logs.info == false ? 
    options.logs.info : 
    defaults.logs.info

    let _SHOW_BUFFER = 
    options.logs.buffer != null && 
    options.logs.buffer == true || 
    options.logs.buffer == false ? 
    options.logs.buffer : 
    defaults.logs.buffer

    let clicked = false;
    let audioContext;
    const analyserRef = useRef(null);

    useEffect(()=>{
        if(audioRef.current) {
            if (options.invisible && options.invisible == true) {
                audioRef.current.style.height = '0'
                audioRef.current.style.width = '0'
                audioRef.current.style.opacity = '0'
            }
        }
        document.addEventListener('click', ()=> {setupAudio()})
    },[])

    const setupAudio = async () => {
        if (audioRef.current instanceof HTMLAudioElement) {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (!analyserRef.current) {
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(audioRef.current);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                if(!options.quality) {
                    print(_SHOW_WARN, "warn", `FFT_WARNING\nNO QUALITY PROPERTY SET\nDEFAULT QUALITY SET TO ${defaults.quality.string.toUpperCase()}`);
                    analyser.fftSize = defaults.quality.number
                } else {
                    if(isNaN(options.quality)){
                        switch(options.quality) {
                            case "ultra":
                                analyser.fftSize = 8192;
                                break;
                            case "high": 
                                analyser.fftSize = 2048;
                                break;
                            case "medium":
                                analyser.fftSize = 512;
                                break;
                            case "low":
                                analyser.fftSize = 128;
                                break;
                            default:
                                print(_SHOW_WARN, "warn", `FFT_WARNING\nNO QUALITY PROPERTY CONTAINS ${options.quality} AS AN OVERLOAD\nDEFAULT QUALITY SET TO ${defaults.quality.string.toUpperCase()}`);
                                analyser.fftSize = defaults.quality.number;
                        }
                    } else {
                        if (isPowerOfTwo(options.quality) && (Math.pow(2, 5) <= options.quality && options.quality <= Math.pow(2, 15))) {
                            analyser.fftSize = options.quality;
                        } else {
                            print(_SHOW_WARN, "warn", "FFT_WARNING\nQUALITY MUST BE POWER OF 2 BETWEEN 2^5 AND 2^15\n[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]\nDEFAULT QUALITY SET TO "+ defaults.quality);
                            analyser.fftSize = defaults.quality.number;
                        }
                    }
                }
                print(_SHOW_BUFFER, "log", `AUDIO_BUFFER_READY\nFFT_SIZE=${analyser.fftSize}\nSOURCE=${analyser ? 'CONNECT' : 'ERR'}`);
                analyserRef.current = analyser;
                if(!audioRef.current) return print(_SHOW_ERROR, "error", 'AUDIO_ERR\nNO AUDIO FOUND TO PLAY\nSTOPPING...')
                    if(options.play && options.play == true)
                        if(audioRef.current.paused)
                            audioRef.current.play()
                updateGradient();
            }
        }
        if(!clicked) {
            clicked = true;
            elements.forEach((element, elementIndex) => {
                if(!element.effects) return print(_SHOW_WARN, "warn", `ELEMENT_WARNING\nNO EFFECTS APPLIED AT ELEMENT[${elementIndex}]\nNO EFFECTS WILL BE APPLIED`)
                if (!element.ref) return print(_SHOW_ERROR, "error", `ELEMENT_ERROR\nMISSING REF_PROP AT ELEMENT[${elementIndex}]\nNO REF TO APPLY EFFECTS`)
                findRepeatedWords(element.effects, _SHOW_ERROR, elementIndex)
                element.effects.forEach((effect, effectIndex) => {
                    if (!effect.blending) return print(_SHOW_WARN, "warn", `ELEMENT_WARNING\nNO BLENDING APPLIED AT ELEMENT[${elementIndex}].EFFECT[${effectIndex}]\nDEFAULT BLENDING IS ${defaults.blending}`)
                    let [firstWord, ...otherWords] = effect.type.split(' ');
                    switch(firstWord){
                        case "text-shadow":
                        case "size":
                        case "font-size":
                            break;
                        case "custom":
                            print(_SHOW_INFO, "log", `EFFECT_INFO\nCUSTOM EFFECT APPLIED AT ELEMENT[${elementIndex}]\n${otherWords.join(' ')}`)
                            break;
                        default: 
                            print(_SHOW_ERROR, "error", `EFFECT_ERROR\nEFFECT DOES NOT CONTAIN ${firstWord} AS OVERLOAD AT ELEMENT[${elementIndex}]\nNO EFFECTS WILL BE APPLIED`)
                    }
                })
            })
        }
    }

    const updateGradient = () => {
        const analyser = analyserRef.current;

        if (analyser) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            // Filtra las frecuencias 
            const lowFrequencyData = dataArray.slice(
                options.minFreq == null || isNaN(options.minFreq) ? defaults.minFreq : options.minFreq, 
                options.maxFreq == null || isNaN(options.maxFreq) ? defaults.maxFreq : options.maxFreq
            );

            // Calcule la intensidad promedio de las frecuencias bajas
            const averageIntensity =
                Array.from(lowFrequencyData).reduce((sum, value) => sum + value, 0) / lowFrequencyData.length;

            // Interpola la intensidad con una función easeInOutQuad modificada
            const easedIntensity = easeInOutQuad(averageIntensity / 255);

            elements.forEach((element, index) => {
                if(!element.ref.current) return;
                if(!element.effects) return;
                element.effects.forEach(effect => {
                    if(!effect) return;
                    let intensit = easedIntensity * (!effect.intensity || isNaN(effect.intensity) ? defaults.intensity : effect.intensity) ;
                    let [firstWord, ...otherWords] = effect.type.split(' ');
                    switch(firstWord) {
                        case "text-shadow":
                            element.ref.current.style.textShadow = `0 0 ${intensit}em ${!effect.color || !isCSSColor(effect.color) ? defaults.color : effect.color}`;
                            break;
                        case "box-shadow":
                            element.ref.current.style.boxShadow = `0 0 ${intensit}em ${!effect.color || !isCSSColor(effect.color) ? defaults.color : effect.color}`;
                            break;
                        case "size":
                            element.ref.current.style.width = `${intensit}em`;
                            element.ref.current.style.height = `${intensit}em`;
                            break;
                        case "font-size":
                            let fontSize = 16; // Default font size for other elements
                            switch(element.ref.current.tagName.toLowerCase()) {
                                case "p":
                                    fontSize = 16;
                                    break;
                                case "h1":
                                    fontSize = 64;
                                    break;
                                case "h2":
                                    fontSize = 32;
                                    break;
                                case "h3":
                                    fontSize = 24;
                                    break;
                                case "h4":
                                    fontSize = 20;
                                    break;
                                case "h5":
                                    fontSize = 18;
                                    break;
                                case "h6":
                                    fontSize = 16;
                                    break;
                                default:
                                    fontSize = 16; // Default font size for other elements
                            }
                            // Retain existing font size and add the dynamic change
                            element.ref.current.style.fontSize = `${fontSize + intensit}px`;
                            break;
                        case "custom":
                            let t = otherWords.join(' ');
                            // Preserve existing styles and add the dynamic change
                            element.ref.current.style = element.ref.current.style.cssText + dynamicRepl(t, intensit);
                            break;
                    }
                    element.ref.current.style.translate = `${!effect.blending || isNaN(effect.blending) ? defaults.blending : effect.blending}ms`;
                });
            })

            requestAnimationFrame(updateGradient);
        }
    };
}

export default useVisualizer;