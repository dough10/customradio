#!/usr/bin/env node

/**
 * Usage: node translate-js.js front de es fr ...
 */

function getInput() {
  if (process.argv[2] === 'front') {
    return {path: "html/js/CustomRadioApp/utils/lang", file: "html/js/CustomRadioApp/utils/lang/en.js"};
  } else {
    return {path: 'src/locales', file: 'src/locales/en.js'};
  }
}

const input = getInput();

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

if (process.argv.length < 4) {
  console.error("Usage: node translate-js.js input.js lang1 [lang2 ...]");
  process.exit(1);
}

const inputFile = input.file;
const languages = process.argv.slice(3);

const outDir = input.path;
fs.mkdirSync(outDir, { recursive: true });

const client = new OpenAI();
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractEntries(jsContent) {
  const staticRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(['"])([\s\S]*?)\2,?\s*$/;
  const funcRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*=>\s*`([\s\S]*?)`,?\s*$/;
  const tmplRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*`([\s\S]*?)`,?\s*$/;   // NEW

  const entries = [];
  let buffer = "";
  let inTemplate = null;

  for (const line of jsContent.split("\n")) {
    if (line.trim().startsWith("//")) continue;

    if (inTemplate) {
      buffer += "\n" + line;
      if (line.includes("`")) {
        entries.push({ type: "template", key: inTemplate.key, value: buffer.replace(/`$/, "") });
        inTemplate = null;
        buffer = "";
      }
      continue;
    }

    let m;
    if ((m = line.match(staticRegex))) {
      entries.push({ type: "static", key: m[1], value: m[3] });
    } else if ((m = line.match(funcRegex))) {
      entries.push({ type: "func", key: m[1], arg: m[2], value: m[3] });
    } else if ((m = line.match(tmplRegex))) {
      if (!line.trim().endsWith("`")) {
        // start of multiline template
        inTemplate = { key: m[1] };
        buffer = m[2];
      } else {
        entries.push({ type: "template", key: m[1], value: m[2] });
      }
    }
  }
  return entries;
}

async function translate(entries, lang) {
  // Prepare JSON for translation
  const json = {};
  for (const e of entries) {
    if (e.type === 'static') {
      json[e.key] = e.value;
    } else if (e.type === 'func') {
      // Replace placeholder with ___
      const placeholder = e.value.replace(new RegExp(`\\$\\{${e.arg}\\}`, 'g'), '___');
      json[e.key] = placeholder;
    } else if (e.type === 'template') {
      json[e.key] = e.value;
    }
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
          You are a professional UI/UX translator. 
          Translate only the JSON values into natural, idiomatic ${lang} suitable for app interfaces. 
          Do not change the keys. Keep placeholders like ___ unchanged. 
          If the text contains HTML tags, keep them in place and only translate the text content. 
          Respond ONLY with valid JSON, without code fences, without commentary.
        `
      },
      {
        role: "user",
        content: JSON.stringify(json, null, 2),
      }
    ],
    temperature: 0.2,
  });

  const translatedText = response.choices[0].message.content.trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '');
  
  let translatedJson;
  try {
    translatedJson = JSON.parse(translatedText);
  } catch (err) {
    throw new Error(`Failed to parse translated JSON: ${err}\n---\n${translatedText}`);
  }

  const fileStart = (process.argv[2] === 'front') ? `export const ${lang}` : "module.exports";

  let output = `${fileStart} = {\n`;
  for (const e of entries) {
    let val = translatedJson[e.key];

    if (e.type === 'static') {
      const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      output += `  ${e.key}: "${escaped}",\n`;

    } else if (e.type === 'func') {
      const restored = val.replace(/___/g, `\${${e.arg}}`);
      const escaped = restored.replace(/`/g, "\\`"); // escape backticks
      output += `  ${e.key}: ${e.arg} => \`${escaped}\`,\n`;

    } else if (e.type === 'template') {
      if (val.includes("\n") || val.includes("`")) {
        // safer: fall back to quoted string
        const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        output += `  ${e.key}: "${escaped}",\n`;
      } else {
        // normal case
        output += `  ${e.key}: \`${val}\`,\n`;
      }
    }
  }
  output += "};\n";

  return output;
}

(async () => {
  const jsContent = fs.readFileSync(inputFile, 'utf8');
  const entries = extractEntries(jsContent);

  for (const lang of languages) {
    console.log(`Translating to ${lang}...`);
    try {
      const translated = await translate(entries, lang);
      const outputFile = path.join(outDir, `${lang}.js`);
      fs.writeFileSync(outputFile, translated, 'utf8');
      console.log(`Translation for ${lang} saved to ${outputFile}`);
    } catch (err) {
      console.error(`Error translating to ${lang}:`, err);
    }
  }
})();
