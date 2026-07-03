import { inflateRawSync } from "zlib";

/** Minimal docx → document.xml extractor (no external deps). */
export async function parseDocxFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const entry = findDocumentXml(bytes);
  if (!entry) throw new Error("document.xml not found in docx");

  let content = bytes.slice(entry.offset, entry.offset + entry.compressedSize);
  if (entry.compression === 8) {
    content = inflateRawSync(content);
  }

  return new TextDecoder("utf-8").decode(content);
}

interface ZipEntry {
  name: string;
  offset: number;
  compressedSize: number;
  compression: number;
}

function findDocumentXml(data: Uint8Array): ZipEntry | null {
  let i = 0;
  while (i < data.length - 4) {
    if (
      data[i] === 0x50 &&
      data[i + 1] === 0x4b &&
      data[i + 2] === 0x03 &&
      data[i + 3] === 0x04
    ) {
      const compression = data[i + 8] | (data[i + 9] << 8);
      const compressedSize =
        data[i + 18] | (data[i + 19] << 8) | (data[i + 20] << 16) | (data[i + 21] << 24);
      const nameLen = data[i + 26] | (data[i + 27] << 8);
      const extraLen = data[i + 28] | (data[i + 29] << 8);
      const name = new TextDecoder("utf-8").decode(
        data.slice(i + 30, i + 30 + nameLen)
      );
      const dataStart = i + 30 + nameLen + extraLen;

      if (name === "word/document.xml") {
        return {
          name,
          offset: dataStart,
          compressedSize,
          compression,
        };
      }
      i = dataStart + compressedSize;
    } else {
      i++;
    }
  }
  return null;
}
