import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, relative, basename, extname } from "path";
import { featureCollection } from "@turf/helpers";
import { fileURLToPath } from "url";
import buildPage from "./build-page.js";
import { createHash } from "crypto";
import bbox from "@turf/bbox";
import mkdirp from "mkdirp";
import im from "imagemagick";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesPath = join(__dirname, "..", "src", "pages");
const buildPath = join(__dirname, "..", "docs");

async function resize(path, outputPath, shape) {
  return await new Promise((resolve, reject) => {
    im.convert(
      [path, "-resize", shape, "-quality", 70, outputPath],
      function (err, stdout) {
        if (err) return reject(err);
        resolve(stdout);
      }
    );
  });
}

export default async function buildAssets(metadata) {
  let route = null;
  const assets = metadata.assets || {};
  const mdAssets = {};
  const path = join(pagesPath, metadata.path);

  if (assets) {
    for (const [label, inPath] of Object.entries(assets)) {
      let hash, fingerprint;
      console.log("  -", inPath);
      const assetPath = join(path, inPath);
      const data = readFileSync(assetPath);

      const dir = join(buildPath, metadata.path);
      const ext = extname(inPath);
      const base = basename(inPath, ext);

      switch (ext.toLowerCase()) {
        case ".geojson":
          break;
        case ".jpg":
        case ".jpeg":
        case ".png":
          const sizes = [
            ["sm", "640x"],
            ["md", "1280x"],
            ["lg", "2560x"],
          ];

          hash = createHash("sha256");
          fingerprint = hash.update(data).digest("hex").substr(0, 8);

          assets[label] = {};
          for (const [suf, size] of sizes) {
            const outName = `${base}-${suf}-${fingerprint}.jpg`;
            const outPath = join(dir, outName);
            mdAssets[`${base}-${suf}.jpg`] = join(metadata.path, outName);
            mkdirp.sync(dirname(outPath));
            if (!existsSync(outPath)) {
              await resize(assetPath, outPath, size);
            }
            assets[label][suf] = outName;
          }

          break;
      }
    }
  }

  return { mdAssets, assets, route };
}
