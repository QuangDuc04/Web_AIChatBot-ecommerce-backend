import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Category } from "./Category";
import { Brand } from "./Brand";
import { ProductImage } from "./ProductImage";
import { ProductVariant } from "./ProductVariant";
import { ProductReview } from "./ProductReview";
import { OrderItem } from "./OrderItem";
import { Inventory } from "./Inventory";
import { UnitType } from "../types/enums";

@Entity("products")
@Index(["categoryId"])
@Index(["brandId"])
@Index(["price"])
@Index(["createdAt"])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 500 })
  name: string;

  @Column({ type: "varchar", length: 500, unique: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  shortDescription: string;

  @Column({ type: "uuid" })
  categoryId: string;

  @Column({ type: "uuid", nullable: true })
  brandId: string;

  /** Giá bán (VND) */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  price: number;

  /** Giá so sánh / giá gốc */
  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  comparePrice: number;

  /** Giá vốn */
  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  costPrice: number;

  /** Đơn vị bán hàng (cuộn / thùng / cái) — null = không hiển thị đơn vị */
  @Column({ type: "enum", enum: UnitType, nullable: true, default: null })
  unitType: UnitType | null;

  /** Số lượng đơn vị con trong 1 thùng (VD: 1 thùng = 50 cuộn) */
  @Column({ type: "int", nullable: true, default: null })
  unitsPerBox: number | null;

  /** Đơn vị con trong thùng (cuộn hoặc cái) */
  @Column({ type: "enum", enum: UnitType, nullable: true, default: null })
  boxSubUnit: UnitType | null;

  /** Giá bán theo thùng (VND) — null nếu không bán theo thùng */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    default: null,
  })
  boxPrice: number | null;

  @Column({ type: "varchar", length: 100, unique: true })
  sku: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  barcode: string;

  @Column({ type: "int", default: 0 })
  quantity: number;

  /** Trọng lượng (kg) */
  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  weight: number;

  /** Kích thước {length, width, height} (cm) */
  @Column({ type: "json", nullable: true })
  dimensions: { length: number; width: number; height: number };

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isFeatured: boolean;

  @Column({ type: "json", nullable: true })
  tags: string[];

  /** Link sản phẩm trên Shopee */
  @Column({ type: "varchar", length: 1000, nullable: true })
  shopeeLink: string;

  /** Link sản phẩm trên TikTok Shop */
  @Column({ type: "varchar", length: 1000, nullable: true })
  tiktokLink: string;

  @Column({ type: "int", default: 0 })
  views: number;

  @Column({ type: "int", default: 0 })
  soldCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "brandId" })
  brand: Brand;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory[];
}
