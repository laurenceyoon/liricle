import parser from "./parser.js";
import sync from "./sync.js";

export default class Liricle {
      #activeLine = null;
      #activeWord = null;
      #onInit = () => {};
      #onSync = () => {};

      constructor() {
            this.data = null;
      }

      /**
       * initialize Liricle
       * @param {Object} options
       * @param {string} options.text - lrc text
       * @param {string} options.url - lrc file url
       */
      async init({ text, url }) {            
            if (url) {
                  try {
                        const resp = await fetch(url);

                        if (!resp.ok) {
                              throw Error(`${resp.status} ${resp.statusText} (${resp.url})`);
                        }

                        const body = await resp.text();
                        this.data = parser(body);
                  } 
                  
                  catch (error) {
                        throw Error(`Liricle.init(): ${error.message}`);
                  }
            } 

            else if (text) {
                  this.data = parser(text);
            } 
            
            else {
                  throw Error(`Liricle.init(): missing argument`);
            }
            
            this.#onInit(this.data);
      }

      /**
       * sync lyric with current time
       * @param {number} time - currrent time from audio player or something else in seconds
       * @param {number} offset - lyric offset in seconds
       * @param {boolean} continuous - always emit sync event 
       */
      sync(time, offset = 0, continuous = false) {
            if (time == undefined) {
                  throw Error("Liricle.sync(): missing 'time' argument");
            }

            if (typeof time != "number") {
                  throw Error("Liricle.sync(): 'time' argument must be a number!");
            }

            if (typeof offset != "number") {
                  throw Error("Liricle.sync(): 'offset' argument must be a number!");
            }

            if (typeof continuous != "boolean") {
                  throw Error("Liricle.sync(): 'continuous' argument must be a boolean!");
            }

            const { line, word } = sync(this.data, time + offset);
            
            if (line == null && word == null) return;

            if (this.data.enhanced && word != null) {
                  if (
                        continuous == false &&
                        line.index == this.#activeLine &&
                        word.index == this.#activeWord
                  ) return;

                  this.#activeLine = line.index;
                  this.#activeWord = word.index;
            }

            else {
                  if (
                        continuous == false &&
                        line.index == this.#activeLine
                  ) return;
                  
                  this.#activeLine = line.index;
            }

            this.#onSync(line, word);
      }

      /**
       * listen to lyricle event
       * @param {string} event - event name
       * @param {function} callback - event callback
       */
      on(event, callback) {
            if (typeof callback != "function") {
                  throw Error("Liricle.on(): 'callback' argument must be a function!");
            }

            switch (event) {
                  case "init":
                        this.#onInit = callback;
                        break;
                  case "sync":
                        this.#onSync = callback;
                        break;
            }
      }
}
