import 'reflect-metadata';
import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';
import { AppDataSource } from '../src/config/database';
import { News } from '../src/entities/News';
import { CloudinaryService } from '../src/services/cloudinary.service';
import { generateSlug } from '../src/utils/slug.util';
import cloudinary from '../src/config/cloudinary';
import '../src/config/cloudinary';

const BASE_URL = 'https://namnguyeninfotech.com';
const LIST_URL = `${BASE_URL}/tin-tuc/tin-thi-truong.html`;
const TOTAL_PAGES = 29;
const DELAY_MS = 1500; // delay giữa các request để tránh bị block

interface ArticleListItem {
  title: string;
  url: string;
  thumbnailUrl: string;
  summary: string;
}

// ==================== UTILITY FUNCTIONS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchHtml(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${res.statusCode} - ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function toAbsoluteUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith('http')) return relativeOrAbsolute;
  if (relativeOrAbsolute.startsWith('//')) return `https:${relativeOrAbsolute}`;
  if (relativeOrAbsolute.startsWith('/')) return `${BASE_URL}${relativeOrAbsolute}`;
  return `${BASE_URL}/${relativeOrAbsolute}`;
}

// ==================== SCRAPING FUNCTIONS ====================

async function scrapeListPage(page: number): Promise<ArticleListItem[]> {
  const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
  console.log(`  Fetching list page ${page}: ${url}`);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const articles: ArticleListItem[] = [];

  $('.newspage-list-row').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('h3.title-news a').first();
    const $img = $el.find('.left-block img').first();
    const $desc = $el.find('.decsription-news').first();

    const title = $link.text().trim();
    const articleUrl = $link.attr('href') || '';
    const thumbnailUrl = $img.attr('src') || '';
    const summary = $desc.text().trim();

    if (title && articleUrl) {
      articles.push({
        title,
        url: toAbsoluteUrl(articleUrl),
        thumbnailUrl: toAbsoluteUrl(thumbnailUrl),
        summary,
      });
    }
  });

  return articles;
}

async function scrapeArticleDetail(url: string): Promise<{ content: string; images: string[] }> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // Lấy nội dung bài viết từ .content-services hoặc .contents-text
  const $content = $('.content-services').first();
  if (!$content.length) {
    const $alt = $('.contents-text').first();
    return {
      content: $alt.html()?.trim() || '',
      images: [],
    };
  }

  // Thu thập tất cả ảnh trong nội dung
  const images: string[] = [];
  $content.find('img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-full') || '';
    if (src) {
      const absUrl = toAbsoluteUrl(src);
      images.push(absUrl);
      // Cập nhật src thành URL tuyệt đối (sẽ được thay bằng Cloudinary URL sau)
      $(img).attr('src', absUrl);
      // Xóa thuộc tính không cần thiết
      $(img).removeAttr('data-sgallery');
      $(img).removeAttr('data-full');
      $(img).removeAttr('data-thumb');
    }
  });

  return {
    content: $content.html()?.trim() || '',
    images,
  };
}

// ==================== UPLOAD FUNCTIONS ====================

async function uploadImageToCloudinary(
  imageUrl: string,
  folder: string,
): Promise<string | null> {
  try {
    const buffer = await downloadImage(imageUrl);
    const result = await CloudinaryService.uploadImage(buffer, folder);
    return result.url;
  } catch (err: any) {
    console.warn(`    ⚠ Failed to upload image ${imageUrl}: ${err.message}`);
    // Fallback: thử upload trực tiếp từ URL
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: `ecommerce/${folder}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      });
      return result.secure_url;
    } catch {
      console.warn(`    ⚠ Fallback upload also failed for ${imageUrl}`);
      return null;
    }
  }
}

async function replaceContentImages(
  content: string,
  images: string[],
): Promise<string> {
  let updatedContent = content;

  for (const imageUrl of images) {
    console.log(`    Uploading content image: ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}`);
    const cloudinaryUrl = await uploadImageToCloudinary(imageUrl, 'news-content');
    if (cloudinaryUrl) {
      updatedContent = updatedContent.split(imageUrl).join(cloudinaryUrl);
    }
    await sleep(500); // tránh rate limit Cloudinary
  }

  return updatedContent;
}

// ==================== MAIN IMPORT ====================

async function main() {
  console.log('='.repeat(60));
  console.log('  IMPORT NEWS FROM namnguyeninfotech.com');
  console.log('='.repeat(60));
  console.log();

  // 1. Kết nối database
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Database connected!\n');

  const newsRepo = AppDataSource.getRepository(News);

  let totalArticles = 0;
  let success = 0;
  let skipped = 0;
  let failed = 0;

  // 2. Scrape tất cả các trang danh sách
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`\n[${'='.repeat(20)} PAGE ${page}/${TOTAL_PAGES} ${'='.repeat(20)}]`);

    let articles: ArticleListItem[];
    try {
      articles = await scrapeListPage(page);
    } catch (err: any) {
      console.error(`  Failed to scrape page ${page}: ${err.message}`);
      continue;
    }

    if (articles.length === 0) {
      console.log('  No articles found on this page. Stopping.');
      break;
    }

    console.log(`  Found ${articles.length} articles\n`);
    totalArticles += articles.length;

    // 3. Xử lý từng bài viết
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const slug = generateSlug(article.title);

      console.log(`  [${i + 1}/${articles.length}] ${article.title}`);

      // Kiểm tra trùng slug
      const existing = await newsRepo.findOne({ where: { slug } });
      if (existing) {
        console.log(`    SKIPPED: Slug "${slug}" already exists.\n`);
        skipped++;
        continue;
      }

      try {
        // 3a. Scrape nội dung chi tiết
        console.log(`    Fetching article detail...`);
        const detail = await scrapeArticleDetail(article.url);
        await sleep(DELAY_MS);

        // 3b. Upload thumbnail lên Cloudinary
        let thumbnailUrl = '';
        if (article.thumbnailUrl) {
          console.log(`    Uploading thumbnail...`);
          const uploaded = await uploadImageToCloudinary(article.thumbnailUrl, 'news');
          thumbnailUrl = uploaded || '';
        }

        // 3c. Upload và thay thế ảnh trong nội dung
        let content = detail.content;
        if (detail.images.length > 0) {
          console.log(`    Uploading ${detail.images.length} content image(s)...`);
          content = await replaceContentImages(content, detail.images);
        }

        // 3d. Tạo bài viết trong database
        const news = newsRepo.create({
          title: article.title,
          slug,
          summary: article.summary || undefined,
          content: content || undefined,
          thumbnail: thumbnailUrl,
          author: 'Nam Nguyễn',
          isActive: true,
          displayOrder: totalArticles - (success + skipped + failed),
          publishedAt: new Date(),
          tags: ['tin thị trường'],
        } as any);

        const saved = await newsRepo.save(news as any);
        console.log(`    SUCCESS: ID=${(saved as any).id}\n`);
        success++;
      } catch (err: any) {
        console.error(`    FAILED: ${err.message}\n`);
        failed++;
      }

      // Delay giữa các bài viết
      await sleep(DELAY_MS);
    }
  }

  // 4. Kết quả
  console.log('\n' + '='.repeat(60));
  console.log('  IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total scraped:  ${totalArticles}`);
  console.log(`  Success:        ${success}`);
  console.log(`  Skipped (dup):  ${skipped}`);
  console.log(`  Failed:         ${failed}`);
  console.log('='.repeat(60));

  await AppDataSource.destroy();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Import failed:', err);
  AppDataSource.destroy();
  process.exit(1);
});
