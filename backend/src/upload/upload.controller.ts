import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Upload')
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  @Post()
  @ApiOperation({ summary: 'Tải lên một file tĩnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        // Generate a random name to avoid collisions
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // Limit 10MB
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng cung cấp một file');
    }
    
    // Return relative URL that can be used to download the file
    // Assumes ServeStaticModule is configured to serve the 'uploads' folder at '/uploads'
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${file.filename}`;
    
    return {
      message: 'Upload thành công',
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }
}
