// @ts-ignore
import * as TinySDF from '@mapbox/tiny-sdf';
import { AlphaImage, StyleGlyph } from '../symbol/AlphaImage';

const fontsize = 24; // Font size in pixels
const buffer = 3;    // Whitespace buffer around a glyph in pixels
const radius = 8;    // How many pixels around the glyph shape to use for encoding distance
const cutoff = 0.25  // How much of the radius (relative) is used for the inside part the glyph

const fontFamily = 'sans-serif'; // css font-family

const sdfGeneratorCache: {
  [fontStack: string]: TinySDF;
} = {};

export function isCJK(char: number): boolean {
  return char >= 0x4E00 && char <= 0x9FFF;
}

export function isUpperCase(char: number): boolean {
  return char >= 'A'.charCodeAt(0) && char <= 'Z'.charCodeAt(0);
}

const fontAdvanceMap = {
  I: 6,
  J: 14,
  L: 14,
  M: 22,
  T: 14,
  W: 22,
  Y: 14,
  m: 20,
  w: 20,
  i: 6,
  l: 6,
  r: 10,
  t: 10,
  ' ': 6,
};

// TODO: 如何获取 font metrics？
// @see https://stackoverflow.com/questions/46126565/how-to-get-font-glyphs-metrics-details-in-javascript
function getCharAdvance(char: number): number {
  if (isCJK(char)) {
    return 24;
  }

  const string = String.fromCharCode(char);
  if (fontAdvanceMap[string]) {
    return fontAdvanceMap[string];
  }

  if (isUpperCase(char)) {
    return 18;
  }

  return 14;
}

export function generateSDF(fontStack: string = '', char: string): StyleGlyph {
  const charCode = char.charCodeAt(0);
  let sdfGenerator = sdfGeneratorCache[fontStack];
  if (!sdfGenerator) {
    // 根据字体描述中包含的信息设置 fontWeight
    let fontWeight = '400';
    if (/bold/i.test(fontStack)) {
      fontWeight = '900';
    } else if (/medium/i.test(fontStack)) {
      fontWeight = '500';
    } else if (/light/i.test(fontStack)) {
      fontWeight = '200';
    }
    // 创建 SDF
    sdfGenerator = sdfGeneratorCache[fontStack]
      = new TinySDF(fontsize, buffer, radius, cutoff, fontFamily, fontWeight);
  }

  return {
    id: charCode,
    // 在 canvas 中绘制字符，使用 Uint8Array 存储 30*30 sdf 数据
    bitmap: new AlphaImage({ width: 30, height: 30 }, sdfGenerator.draw(char)),
    metrics: {
      width: 24,
      height: 24,
      left: 0,
      top: -5,
      // 对于 CJK 需要调整字符间距
      advance: getCharAdvance(charCode)
    }
  };
}
