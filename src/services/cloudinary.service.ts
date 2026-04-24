import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export interface CloudinaryResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<CloudinaryResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `ecommerce/${folder}`,
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        )
        .end(fileBuffer);
    });
  }

  static async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<CloudinaryResult[]> {
    return Promise.all(files.map((f) => this.uploadImage(f.buffer, folder)));
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      console.error(`Failed to delete Cloudinary image: ${publicId}`);
    }
  }

  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    await Promise.all(publicIds.map((id) => this.deleteImage(id)));
  }

  static transformImage(
    publicId: string,
    options: { width?: number; height?: number; crop?: string; quality?: string },
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }
}
