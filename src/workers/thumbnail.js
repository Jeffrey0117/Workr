/**
 * Thumbnail Worker
 * 從影片擷取縮圖
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// execFile (no shell): payload values are passed as argv, never parsed by cmd.exe.
const execFileAsync = promisify(execFile);
const TIMESTAMP_RE = /^\d{1,2}(:\d{1,2}){0,2}(\.\d{1,3})?$/;

// 嘗試載入 sharp
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('[thumbnail] sharp not available, using ffmpeg only');
}

/**
 * 處理縮圖任務
 * @param {Object} job - 任務物件
 * @param {Function} onProgress - 進度回調
 */
async function process(job, onProgress) {
  const {
    videoPath,
    outputPath,
    timestamp = '00:00:01',
    width = 320
  } = job.payload;

  // 檢查輸入檔案
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video not found: ${videoPath}`);
  }

  // 確保輸出目錄存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  onProgress(10, 'Starting ffmpeg...');

  // 用 ffmpeg 擷取畫面
  const isWebp = outputPath.endsWith('.webp');
  const tempPath = isWebp ? outputPath.replace('.webp', '_temp.png') : outputPath;

  const ts = String(timestamp);
  const w = Number(width);
  if (!TIMESTAMP_RE.test(ts)) throw new Error(`Invalid timestamp: ${ts}`);
  if (!Number.isInteger(w) || w < 16 || w > 4096) throw new Error(`Invalid width: ${width}`);

  try {
    await execFileAsync('ffmpeg', [
      '-i', videoPath, '-ss', ts, '-vframes', '1', '-vf', `scale=${w}:-1`, '-y', tempPath,
    ], { timeout: 30000, windowsHide: true });
    onProgress(70, 'Frame extracted');
  } catch (e) {
    throw new Error(`ffmpeg failed: ${e.message}`);
  }

  // 轉換為 WebP（如果需要）
  if (isWebp && sharp) {
    onProgress(80, 'Converting to WebP...');
    try {
      await sharp(tempPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      // 刪除暫存檔
      fs.unlinkSync(tempPath);
      onProgress(100, 'Done');
    } catch (e) {
      throw new Error(`sharp failed: ${e.message}`);
    }
  } else if (isWebp && !sharp) {
    // 沒有 sharp，改輸出為 jpg
    const jpgPath = outputPath.replace('.webp', '.jpg');
    fs.renameSync(tempPath, jpgPath);
    onProgress(100, 'Done (jpg fallback)');
    return { outputPath: jpgPath, format: 'jpg' };
  } else {
    onProgress(100, 'Done');
  }

  // 取得檔案大小
  const stats = fs.statSync(outputPath);

  return {
    outputPath,
    size: stats.size,
    format: isWebp ? 'webp' : path.extname(outputPath).slice(1)
  };
}

module.exports = { process };
