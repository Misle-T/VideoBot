import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export async function downloadFile(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 200000); // 3 min timeout

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

    const buffer = await res.buffer();
    const filePath = path.join(__dirname, '../videos', `${uuidv4()}.mp4`);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  } finally {
    clearTimeout(timeout);
  }
}

