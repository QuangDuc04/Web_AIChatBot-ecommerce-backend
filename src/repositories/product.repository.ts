import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { NotFoundError } from '../errors';
import { ProductFilterDto, ProductSortEnum } from '../dtos/product.dto';
import { analyzeSearchQuery, escapeLike } from '../utils/search-query.util';

export class ProductRepository {
  private repo: Repository<Product>;

  constructor() {
    this.repo = AppDataSource.getRepository(Product);
  }

  async findAll(filters: ProductFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const qb = this.repo.createQueryBuilder('p');

    if (filters.lightweight) {
      // Select only essential columns — skip description, images, heavy TEXT fields
      qb.select([
        'p.id', 'p.name', 'p.slug', 'p.price', 'p.comparePrice',
        'p.unitType', 'p.quantity', 'p.isActive', 'p.isFeatured',
        'p.createdAt', 'p.views', 'p.soldCount',
      ])
        .leftJoin('p.category', 'category').addSelect(['category.id', 'category.name'])
        .leftJoin('p.brand', 'brand').addSelect(['brand.id', 'brand.name']);
    } else {
      qb.leftJoinAndSelect('p.category', 'category')
        .leftJoinAndSelect('p.brand', 'brand')
        .leftJoinAndSelect('p.images', 'images');
    }

    // Filters
    if (filters.search) {
      const words = filters.search.trim().split(/\s+/).filter(Boolean);
      if (filters.searchMode === 'like') {
        // LIKE-based: AND each word against p.name OR category.name
        // Handles short Vietnamese words (e.g. "in") that FULLTEXT drops
        words.forEach((w, i) => {
          qb.andWhere(
            `(p.name LIKE :lw${i} OR category.name LIKE :lw${i})`,
            { [`lw${i}`]: `%${w}%` },
          );
        });
      } else if (filters.searchMode === 'relaxed') {
        // Relaxed: OR-based FULLTEXT + category name LIKE
        const ftQuery = words.map((w) => `${w}*`).join(' ');
        qb.andWhere(
          '(MATCH(p.name, p.description, p.sku) AGAINST (:ftSearch IN BOOLEAN MODE) OR category.name LIKE :catSearch)',
          { ftSearch: ftQuery, catSearch: `%${filters.search}%` },
        );
      } else {
        // Strict (default): AND-based FULLTEXT + category name LIKE fallback
        const ftQuery = words.map((w) => `+${w}*`).join(' ');
        qb.andWhere(
          '(MATCH(p.name, p.description, p.sku) AGAINST (:ftSearch IN BOOLEAN MODE) OR category.name LIKE :catSearch)',
          { ftSearch: ftQuery, catSearch: `%${filters.search}%` },
        );
      }
    }
    if (filters.categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters.brandId) qb.andWhere('p.brandId = :brandId', { brandId: filters.brandId });
    if (filters.minPrice !== undefined) qb.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined) qb.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });
    if (filters.isFeatured !== undefined) qb.andWhere('p.isFeatured = :isFeatured', { isFeatured: filters.isFeatured });
    if (filters.status !== undefined) {
      if (filters.status === 'active') qb.andWhere('p.isActive = :isActive', { isActive: true });
      else if (filters.status === 'inactive') qb.andWhere('p.isActive = :isActive', { isActive: false });
      // 'all' → no filter
    } else if (filters.isActive !== undefined) {
      qb.andWhere('p.isActive = :isActive', { isActive: filters.isActive });
    } else {
      qb.andWhere('p.isActive = :isActive', { isActive: true });
    }

    // Sort
    this.applySort(qb, filters.sort);

    const total = await qb.getCount();
    const products = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items: products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private applySort(qb: SelectQueryBuilder<Product>, sort?: ProductSortEnum) {
    switch (sort) {
      case ProductSortEnum.OLDEST:
        qb.orderBy('p.createdAt', 'ASC'); break;
      case ProductSortEnum.PRICE_ASC:
        qb.orderBy('p.price', 'ASC'); break;
      case ProductSortEnum.PRICE_DESC:
        qb.orderBy('p.price', 'DESC'); break;
      case ProductSortEnum.NAME_ASC:
        qb.orderBy('p.name', 'ASC'); break;
      case ProductSortEnum.NAME_DESC:
        qb.orderBy('p.name', 'DESC'); break;
      case ProductSortEnum.POPULAR:
        qb.orderBy('p.views', 'DESC'); break;
      case ProductSortEnum.BEST_SELLER:
        qb.orderBy('p.soldCount', 'DESC'); break;
      case ProductSortEnum.CATEGORY_ORDER:
        qb.orderBy('category.displayOrder', 'ASC').addOrderBy('p.createdAt', 'DESC'); break;
      case ProductSortEnum.NEWEST:
      default:
        qb.orderBy('p.createdAt', 'DESC');
    }
  }

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'brand', 'images', 'variants', 'inventory'],
    });
  }

  async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) throw new NotFoundError('Không tìm thấy sản phẩm');
    return product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { slug },
      relations: ['category', 'brand', 'images', 'variants', 'inventory'],
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async findFeatured(limit = 10): Promise<Product[]> {
    return this.repo.find({
      where: { isFeatured: true, isActive: true },
      relations: ['images', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findBestSellers(limit = 10): Promise<Product[]> {
    return this.repo.find({
      where: { isActive: true },
      relations: ['images', 'category'],
      order: { soldCount: 'DESC' },
      take: limit,
    });
  }

  async findRelated(productId: string, categoryId: string, limit = 10): Promise<Product[]> {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.images', 'images')
      .where('p.categoryId = :categoryId', { categoryId })
      .andWhere('p.id != :productId', { productId })
      .andWhere('p.isActive = true')
      .orderBy('p.soldCount', 'DESC')
      .take(limit)
      .getMany();
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async incrementViews(id: string): Promise<void> {
    await this.repo.increment({ id }, 'views', 1);
  }

  async incrementSoldCount(id: string, quantity: number): Promise<void> {
    await this.repo.increment({ id }, 'soldCount', quantity);
  }

  async hasOrders(id: string): Promise<boolean> {
    const product = await this.repo.findOne({ where: { id }, relations: ['orderItems'] });
    return (product?.orderItems?.length ?? 0) > 0;
  }

  // ────────────────────────────────────────────────────────────────
  // Scored search — Elasticsearch-style relevance ranking in MySQL
  // ────────────────────────────────────────────────────────────────

  /**
   * Weighted relevance search that scores products across multiple signals:
   *   - Phrase matches in name (longer = heavier)
   *   - Individual word matches in name
   *   - Model number variants in name (e.g. "k80" from "k80x80")
   *   - Category name matches
   *   - SKU matches for model numbers
   *   - FULLTEXT relevance bonus (words >= 3 chars)
   *
   * Returns results ordered by score DESC, with a minimum-match filter
   * to exclude noise.
   */
  async scoredSearch(
    query: string,
    options: { limit?: number; minScore?: number } = {},
  ): Promise<{ items: Product[]; total: number }> {
    const analyzed = analyzeSearchQuery(query);
    if (analyzed.words.length === 0) return { items: [], total: 0 };

    const limit = options.limit || 5;
    const minScore = options.minScore ?? 10;

    const qb = this.repo.createQueryBuilder('p')
      .select([
        'p.id', 'p.name', 'p.slug', 'p.price', 'p.comparePrice',
        'p.unitType', 'p.quantity', 'p.isActive', 'p.isFeatured',
        'p.createdAt', 'p.views', 'p.soldCount',
      ])
      .leftJoin('p.category', 'category').addSelect(['category.id', 'category.name', 'category.slug'])
      .leftJoin('p.brand', 'brand').addSelect(['brand.id', 'brand.name']);

    const scoreTerms: string[] = [];
    const params: Record<string, unknown> = {};
    let idx = 0;

    // ── 1. Phrase matches in p.name (longer phrase = higher weight) ──
    for (const phrase of analyzed.phrases) {
      const k = `sp${idx++}`;
      const weight = phrase.split(/\s+/).length * 20; // 2w=40, 3w=60, 4w=80
      scoreTerms.push(`(CASE WHEN p.name LIKE :${k} THEN ${weight} ELSE 0 END)`);
      params[k] = `%${escapeLike(phrase)}%`;
    }

    // ── 2. Individual word matches in p.name ──
    for (const w of analyzed.words) {
      const k = `sw${idx++}`;
      scoreTerms.push(`(CASE WHEN p.name LIKE :${k} THEN 10 ELSE 0 END)`);
      params[k] = `%${escapeLike(w)}%`;
    }

    // ── 3. Model variant matches in p.name ──
    for (const v of analyzed.modelVariants) {
      const k = `sv${idx++}`;
      scoreTerms.push(`(CASE WHEN p.name LIKE :${k} THEN 15 ELSE 0 END)`);
      params[k] = `%${escapeLike(v)}%`;
    }

    // ── 4. Category name: phrase match ──
    if (analyzed.descriptiveWords.length >= 2) {
      const k = `cp${idx++}`;
      const phrase = analyzed.descriptiveWords.join(' ');
      scoreTerms.push(`(CASE WHEN category.name LIKE :${k} THEN 15 ELSE 0 END)`);
      params[k] = `%${escapeLike(phrase)}%`;
    }

    // ── 5. Category name: individual word matches ──
    for (const w of analyzed.descriptiveWords) {
      const k = `cw${idx++}`;
      scoreTerms.push(`(CASE WHEN category.name LIKE :${k} THEN 5 ELSE 0 END)`);
      params[k] = `%${escapeLike(w)}%`;
    }

    // ── 6. SKU matches for model numbers + variants ──
    for (const m of [...analyzed.modelNumbers, ...analyzed.modelVariants]) {
      const k = `sk${idx++}`;
      scoreTerms.push(`(CASE WHEN p.sku LIKE :${k} THEN 20 ELSE 0 END)`);
      params[k] = `%${escapeLike(m)}%`;
    }

    // ── 6b. Variant name: phrase matches ──
    for (const phrase of analyzed.phrases) {
      const k = `vsp${idx++}`;
      const weight = phrase.split(/\s+/).length * 20;
      scoreTerms.push(
        `(CASE WHEN EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND vv.name LIKE :${k}) THEN ${weight} ELSE 0 END)`,
      );
      params[k] = `%${escapeLike(phrase)}%`;
    }

    // ── 6c. Variant name: individual word matches ──
    for (const w of analyzed.words) {
      const k = `vsw${idx++}`;
      scoreTerms.push(
        `(CASE WHEN EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND vv.name LIKE :${k}) THEN 10 ELSE 0 END)`,
      );
      params[k] = `%${escapeLike(w)}%`;
    }

    // ── 6d. Variant SKU: model number matches ──
    for (const m of [...analyzed.modelNumbers, ...analyzed.modelVariants]) {
      const k = `vsk${idx++}`;
      scoreTerms.push(
        `(CASE WHEN EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND vv.sku LIKE :${k}) THEN 20 ELSE 0 END)`,
      );
      params[k] = `%${escapeLike(m)}%`;
    }

    // ── 7. FULLTEXT relevance bonus (only for words >= 3 chars) ──
    if (analyzed.fulltextWords.length > 0) {
      const k = `ft${idx++}`;
      scoreTerms.push(
        `(COALESCE(MATCH(p.name, p.description, p.sku) AGAINST(:${k} IN BOOLEAN MODE), 0) * 2)`,
      );
      params[k] = analyzed.fulltextWords.map((w) => `${escapeLike(w)}*`).join(' ');
    }

    const scoreExpr = scoreTerms.join(' + ');
    qb.addSelect(`(${scoreExpr})`, 'search_score');

    // ── WHERE: isActive + at least one signal matches ──
    qb.where('p.isActive = true');

    qb.andWhere(new Brackets((sub) => {
      for (const w of analyzed.words) {
        const k = `wf${idx++}`;
        sub.orWhere(`p.name LIKE :${k}`, { [`${k}`]: `%${escapeLike(w)}%` });
        const k2 = `cf${idx++}`;
        sub.orWhere(`category.name LIKE :${k2}`, { [`${k2}`]: `%${escapeLike(w)}%` });
      }
      for (const v of analyzed.modelVariants) {
        const k = `vf${idx++}`;
        sub.orWhere(`p.name LIKE :${k}`, { [`${k}`]: `%${escapeLike(v)}%` });
      }
      for (const m of [...analyzed.modelNumbers, ...analyzed.modelVariants]) {
        const k = `sf${idx++}`;
        sub.orWhere(`p.sku LIKE :${k}`, { [`${k}`]: `%${escapeLike(m)}%` });
      }
      if (analyzed.fulltextWords.length > 0) {
        const k = `ftf${idx++}`;
        sub.orWhere(`MATCH(p.name, p.description, p.sku) AGAINST(:${k} IN BOOLEAN MODE)`, {
          [`${k}`]: analyzed.fulltextWords.map((w) => `${escapeLike(w)}*`).join(' '),
        });
      }
      // ── Variant name / SKU matches ──
      for (const w of analyzed.words) {
        const k = `vwf${idx++}`;
        sub.orWhere(
          `EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND vv.name LIKE :${k})`,
          { [k]: `%${escapeLike(w)}%` },
        );
      }
      for (const m of [...analyzed.modelNumbers, ...analyzed.modelVariants]) {
        const k = `vsf${idx++}`;
        sub.orWhere(
          `EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND vv.sku LIKE :${k})`,
          { [k]: `%${escapeLike(m)}%` },
        );
      }
    }));

    // ── requireExactModel: enforce at SQL level (also checks variants) ──
    // Replaces the JS post-filter so products found only via variant are not excluded.
    const requireExactModel = analyzed.modelNumbers.filter((m) => m.length >= 4);
    if (requireExactModel.length > 0) {
      qb.andWhere(new Brackets((exactSub) => {
        for (const m of requireExactModel) {
          const k1 = `em${idx++}`;
          exactSub.orWhere(`p.name LIKE :${k1}`, { [k1]: `%${escapeLike(m)}%` });
          const k2 = `ems${idx++}`;
          exactSub.orWhere(`p.sku LIKE :${k2}`, { [k2]: `%${escapeLike(m)}%` });
          const k3 = `emv${idx++}`;
          exactSub.orWhere(
            `EXISTS (SELECT 1 FROM product_variants vv WHERE vv.productId = p.id AND (vv.name LIKE :${k3} OR vv.sku LIKE :${k3}))`,
            { [k3]: `%${escapeLike(m)}%` },
          );
        }
      }));
    }

    // Set all score params
    qb.setParameters(params);

    // ── ORDER BY score, then popularity as tiebreaker ──
    qb.orderBy('search_score', 'DESC');
    qb.addOrderBy('p.soldCount', 'DESC');

    // Fetch extra rows, then filter by minScore in JS
    // (TypeORM doesn't support HAVING on computed aliases with getMany)
    const fetchLimit = limit * 3;
    const rawAndEntities = await qb.take(fetchLimit).getRawAndEntities();

    // requireExactModel is now enforced at the SQL level above.
    // JS post-filter only needs to check minScore.
    const filtered: Product[] = [];
    for (let i = 0; i < rawAndEntities.entities.length; i++) {
      const score = Number(rawAndEntities.raw[i]?.search_score ?? 0);
      if (score >= minScore) {
        filtered.push(rawAndEntities.entities[i]);
        if (filtered.length >= limit) break;
      }
    }

    return { items: filtered, total: filtered.length };
  }
}
