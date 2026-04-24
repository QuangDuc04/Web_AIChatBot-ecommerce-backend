import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { NotFoundError } from '../errors';

export class CategoryRepository {
  private repo: Repository<Category>;

  constructor() {
    this.repo = AppDataSource.getRepository(Category);
  }

  async findAll(): Promise<Category[]> {
    return this.repo.find({
      relations: ['parent', 'children'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id }, relations: ['parent', 'children'] });
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const cat = await this.findById(id);
    if (!cat) throw new NotFoundError('Không tìm thấy danh mục');
    return cat;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOne({ where: { slug }, relations: ['parent', 'children'] });
  }

  async findByParentId(parentId: string): Promise<Category[]> {
    return this.repo.find({ where: { parentId }, order: { displayOrder: 'ASC' } });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.repo.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { displayOrder: 'ASC' },
    });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const cat = this.repo.create(data);
    return this.repo.save(cat);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { parentId: id } });
    return count > 0;
  }

  async hasProducts(id: string): Promise<boolean> {
    const cat = await this.repo.findOne({ where: { id }, relations: ['products'] });
    return (cat?.products?.length ?? 0) > 0;
  }

  async buildCategoryTree(): Promise<Category[]> {
    const roots = await this.repo.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children', 'children.children'],
      order: { displayOrder: 'ASC' },
    });
    return roots;
  }
}
